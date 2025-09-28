import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket } from 'socket.io';
import { prisma } from '../server';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerJoinSchema,
  PlayerAnswerSchema,
  PlayerBuzzSchema,
  HostCreateRoomSchema,
  HostStartQuestionSchema,
  HostRevealSchema,
  HostStartBuzzerSchema,
  HostMarkCorrectSchema,
  RoomState,
  PlayerPublic,
  QuestionPublic,
  LeaderboardData,
  DEFAULT_ROOM_SETTINGS,
} from '../types/shared';
import { generateRoomCode } from './utils';
import { calculateScore } from './scoring';

// Room state management
const roomStates = new Map<string, RoomState>();
const roomTimers = new Map<string, NodeJS.Timeout>();
const roomBuzzerStates = new Map<string, { isArmed: boolean; questionId: string; topN: number }>();

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function setupSocketHandlers(io: SocketIOServer) {
  // Room namespace
  const roomNamespace = io.of(/^\/room\/[A-Z0-9]+$/);

  roomNamespace.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const roomCode = socket.nsp.name.split('/')[2];
    console.log(`Player connected to room: ${roomCode}`);

    // Player join
    socket.on('player:join', async (data) => {
      try {
        const validatedData = PlayerJoinSchema.parse(data);
        
        // Check rate limiting
        if (isRateLimited(socket.id)) {
          socket.emit('server:error', { code: 'RATE_LIMITED', message: 'Too many requests' });
          return;
        }

        // Check if room exists
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
          include: { players: true, teams: true }
        });

        if (!room) {
          socket.emit('server:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
          return;
        }

        // Check if nickname is unique in room
        const existingPlayer = room.players.find(p => p.nickname === validatedData.nickname);
        if (existingPlayer) {
          socket.emit('server:error', { code: 'NICKNAME_TAKEN', message: 'Nickname already taken' });
          return;
        }

        // Create player
        const player = await prisma.player.create({
          data: {
            roomId: room.id,
            nickname: validatedData.nickname,
            avatar: validatedData.avatar,
          }
        });

        // Update room state
        await updateRoomState(roomCode);
        
        // Join socket room
        socket.join(roomCode);
        socket.data.playerId = player.id;
        socket.data.roomId = room.id;

        // Broadcast player joined
        const playerPublic: PlayerPublic = {
          id: player.id,
          nickname: player.nickname,
          avatar: player.avatar || undefined,
          isHost: player.isHost,
          teamId: player.teamId,
          score: player.score,
        };

        socket.to(roomCode).emit('server:playerJoined', { player: playerPublic });
        socket.emit('server:roomState', roomStates.get(roomCode)!);

      } catch (error) {
        console.error('Error in player:join:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    // Player answer
    socket.on('player:answer', async (data) => {
      try {
        const validatedData = PlayerAnswerSchema.parse(data);
        
        if (isRateLimited(socket.id)) {
          socket.emit('server:error', { code: 'RATE_LIMITED', message: 'Too many requests' });
          return;
        }

        if (!socket.data.playerId || !socket.data.roomId) {
          socket.emit('server:error', { code: 'NOT_JOINED', message: 'Must join room first' });
          return;
        }

        // Get current question
        const room = await prisma.room.findUnique({
          where: { id: socket.data.roomId },
          include: { currentQuestion: { include: { options: true } } }
        });

        if (!room?.currentQuestion || room.currentQuestion.id !== validatedData.questionId) {
          socket.emit('server:error', { code: 'INVALID_QUESTION', message: 'Question not active' });
          return;
        }

        // Calculate response time
        const timeMs = Date.now() - (roomStates.get(roomCode)?.questionStartTime || Date.now());

        // Validate answer based on question type
        let isCorrect = false;
        if (room.currentQuestion.type === 'single' && validatedData.optionIds?.length === 1) {
          const selectedOption = room.currentQuestion.options.find(o => o.id === validatedData.optionIds[0]);
          isCorrect = selectedOption?.isCorrect || false;
        } else if (room.currentQuestion.type === 'multi' && validatedData.optionIds) {
          const correctOptions = room.currentQuestion.options.filter(o => o.isCorrect);
          isCorrect = correctOptions.length === validatedData.optionIds.length &&
            correctOptions.every(opt => validatedData.optionIds!.includes(opt.id));
        } else if (room.currentQuestion.type === 'text' && validatedData.textAnswer) {
          // For text answers, we'll need manual verification or simple matching
          isCorrect = false; // Will be set by host
        }

        // Save response
        await prisma.response.create({
          data: {
            roomId: socket.data.roomId,
            questionId: validatedData.questionId,
            playerId: socket.data.playerId,
            optionIdsJson: validatedData.optionIds ? JSON.stringify(validatedData.optionIds) : null,
            textAnswer: validatedData.textAnswer,
            timeMs,
            isCorrect,
          }
        });

        // Update player score
        if (isCorrect) {
          const score = calculateScore(room.currentQuestion, timeMs, roomStates.get(roomCode)?.settings);
          await prisma.player.update({
            where: { id: socket.data.playerId },
            data: { score: { increment: score } }
          });
        }

        // Update room state
        await updateRoomState(roomCode);

      } catch (error) {
        console.error('Error in player:answer:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    // Player buzz
    socket.on('player:buzz', async (data) => {
      try {
        const validatedData = PlayerBuzzSchema.parse(data);
        
        if (isRateLimited(socket.id)) {
          socket.emit('server:error', { code: 'RATE_LIMITED', message: 'Too many requests' });
          return;
        }

        if (!socket.data.playerId || !socket.data.roomId) {
          socket.emit('server:error', { code: 'NOT_JOINED', message: 'Must join room first' });
          return;
        }

        const buzzerState = roomBuzzerStates.get(roomCode);
        if (!buzzerState?.isArmed || buzzerState.questionId !== validatedData.questionId) {
          socket.emit('server:error', { code: 'BUZZER_NOT_ARMED', message: 'Buzzer not armed' });
          return;
        }

        // Record buzz
        const timeMs = Date.now() - (roomStates.get(roomCode)?.questionStartTime || Date.now());
        
        const existingBuzz = await prisma.buzz.findFirst({
          where: {
            roomId: socket.data.roomId,
            questionId: validatedData.questionId,
            playerId: socket.data.playerId,
          }
        });

        if (existingBuzz) {
          socket.emit('server:error', { code: 'ALREADY_BUZZED', message: 'Already buzzed' });
          return;
        }

        const buzzCount = await prisma.buzz.count({
          where: {
            roomId: socket.data.roomId,
            questionId: validatedData.questionId,
          }
        });

        if (buzzCount >= buzzerState.topN) {
          socket.emit('server:error', { code: 'BUZZER_FULL', message: 'Buzzer slots full' });
          return;
        }

        await prisma.buzz.create({
          data: {
            roomId: socket.data.roomId,
            questionId: validatedData.questionId,
            playerId: socket.data.playerId,
            rank: buzzCount + 1,
            timeMs,
          }
        });

        // Update room state and broadcast rankings
        await updateRoomState(roomCode);
        await broadcastBuzzRankings(roomCode);

      } catch (error) {
        console.error('Error in player:buzz:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    // Host events
    socket.on('host:createRoom', async (data) => {
      try {
        const validatedData = HostCreateRoomSchema.parse(data);
        const settings = { ...DEFAULT_ROOM_SETTINGS, ...validatedData.settings };
        
        const roomCode = generateRoomCode();
        const room = await prisma.room.create({
          data: {
            code: roomCode,
            status: 'lobby',
            settingsJson: JSON.stringify(settings),
          }
        });

        // Initialize room state
        roomStates.set(roomCode, {
          code: roomCode,
          status: 'lobby',
          players: [],
          teams: [],
          settings,
        });

        socket.join(roomCode);
        socket.data.roomId = room.id;
        socket.data.isHost = true;

        socket.emit('server:roomState', roomStates.get(roomCode)!);

      } catch (error) {
        console.error('Error in host:createRoom:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    socket.on('host:startQuestion', async (data) => {
      try {
        const validatedData = HostStartQuestionSchema.parse(data);
        
        if (!socket.data.roomId || !socket.data.isHost) {
          socket.emit('server:error', { code: 'NOT_HOST', message: 'Must be host' });
          return;
        }

        const question = await prisma.question.findUnique({
          where: { id: validatedData.questionId },
          include: { options: true }
        });

        if (!question) {
          socket.emit('server:error', { code: 'QUESTION_NOT_FOUND', message: 'Question not found' });
          return;
        }

        // Update room
        await prisma.room.update({
          where: { id: socket.data.roomId },
          data: { 
            currentQuestionId: validatedData.questionId,
            status: 'in_progress'
          }
        });

        // Start timer
        const roomState = roomStates.get(roomCode);
        if (roomState) {
          roomState.currentQuestion = {
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            imageUrl: question.imageUrl,
            audioUrl: question.audioUrl,
            timeLimitSeconds: question.timeLimitSeconds,
            points: question.points,
            options: question.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              imageUrl: opt.imageUrl,
            })),
          };
          roomState.status = 'in_progress';
          roomState.questionStartTime = Date.now();

          // Start countdown timer
          startQuestionTimer(roomCode, question.timeLimitSeconds);
        }

        // Broadcast question
        const questionPublic: QuestionPublic = {
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl,
          timeLimitSeconds: question.timeLimitSeconds,
          points: question.points,
          options: question.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            imageUrl: opt.imageUrl,
          })),
        };

        io.to(roomCode).emit('server:question', questionPublic);

      } catch (error) {
        console.error('Error in host:startQuestion:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    socket.on('host:startBuzzer', async (data) => {
      try {
        const validatedData = HostStartBuzzerSchema.parse(data);
        
        if (!socket.data.roomId || !socket.data.isHost) {
          socket.emit('server:error', { code: 'NOT_HOST', message: 'Must be host' });
          return;
        }

        // Arm buzzer
        roomBuzzerStates.set(roomCode, {
          isArmed: true,
          questionId: validatedData.questionId,
          topN: validatedData.topN || 1,
        });

        // Start buzzer timer
        const roomState = roomStates.get(roomCode);
        if (roomState) {
          roomState.questionStartTime = Date.now();
          startQuestionTimer(roomCode, 10); // 10 second buzzer timer
        }

        io.to(roomCode).emit('server:question', {
          id: validatedData.questionId,
          type: 'buzzer',
          prompt: 'BUZZ IN!',
          timeLimitSeconds: 10,
          points: 200,
        });

      } catch (error) {
        console.error('Error in host:startBuzzer:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    socket.on('host:reveal', async (data) => {
      try {
        const validatedData = HostRevealSchema.parse(data);
        
        if (!socket.data.roomId || !socket.data.isHost) {
          socket.emit('server:error', { code: 'NOT_HOST', message: 'Must be host' });
          return;
        }

        // Get question and responses
        const question = await prisma.question.findUnique({
          where: { id: validatedData.questionId },
          include: { options: true }
        });

        const responses = await prisma.response.findMany({
          where: {
            roomId: socket.data.roomId,
            questionId: validatedData.questionId,
          },
          include: { player: true }
        });

        // Calculate distribution
        const distribution: { [optionId: string]: number } = {};
        const correctOptionIds = question?.options.filter(o => o.isCorrect).map(o => o.id) || [];

        responses.forEach(response => {
          if (response.optionIdsJson) {
            const optionIds = JSON.parse(response.optionIdsJson);
            optionIds.forEach((optionId: string) => {
              distribution[optionId] = (distribution[optionId] || 0) + 1;
            });
          }
        });

        // Broadcast reveal
        io.to(roomCode).emit('server:reveal', {
          questionId: validatedData.questionId,
          correctOptionIds,
          distribution,
          explanation: question?.answerExplanation,
        });

        // Update room state
        await updateRoomState(roomCode);

      } catch (error) {
        console.error('Error in host:reveal:', error);
        socket.emit('server:error', { code: 'VALIDATION_ERROR', message: 'Invalid data' });
      }
    });

    socket.on('host:showLeaderboard', async () => {
      if (!socket.data.roomId || !socket.data.isHost) {
        socket.emit('server:error', { code: 'NOT_HOST', message: 'Must be host' });
        return;
      }

      await broadcastLeaderboard(roomCode);
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected from room: ${roomCode}`);
    });
  });
}

// Helper functions
async function updateRoomState(roomCode: string) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: { 
      players: true, 
      teams: true,
      currentQuestion: { include: { options: true } }
    }
  });

  if (!room) return;

  const players: PlayerPublic[] = room.players.map(p => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar || undefined,
    isHost: p.isHost,
    teamId: p.teamId,
    score: p.score,
  }));

  const teams = room.teams.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
    score: 0, // Calculate team scores
  }));

  const currentQuestion = room.currentQuestion ? {
    id: room.currentQuestion.id,
    type: room.currentQuestion.type,
    prompt: room.currentQuestion.prompt,
    imageUrl: room.currentQuestion.imageUrl,
    audioUrl: room.currentQuestion.audioUrl,
    timeLimitSeconds: room.currentQuestion.timeLimitSeconds,
    points: room.currentQuestion.points,
    options: room.currentQuestion.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      imageUrl: opt.imageUrl,
    })),
  } : undefined;

  const roomState: RoomState = {
    code: room.code,
    status: room.status,
    players,
    teams,
    currentQuestion,
    settings: JSON.parse(room.settingsJson),
  };

  roomStates.set(roomCode, roomState);
}

function startQuestionTimer(roomCode: string, timeLimitSeconds: number) {
  // Clear existing timer
  const existingTimer = roomTimers.get(roomCode);
  if (existingTimer) {
    clearInterval(existingTimer);
  }

  let timeRemaining = timeLimitSeconds * 1000;
  
  const timer = setInterval(() => {
    timeRemaining -= 250;
    
    if (timeRemaining <= 0) {
      clearInterval(timer);
      roomTimers.delete(roomCode);
      return;
    }

    // Broadcast time remaining
    const io = require('socket.io').Server;
    io.to(roomCode).emit('server:time', {
      questionId: roomStates.get(roomCode)?.currentQuestion?.id || '',
      timeRemainingMs: timeRemaining,
    });
  }, 250);

  roomTimers.set(roomCode, timer);
}

async function broadcastBuzzRankings(roomCode: string) {
  const roomState = roomStates.get(roomCode);
  if (!roomState?.currentQuestion) return;

  const buzzes = await prisma.buzz.findMany({
    where: {
      roomId: roomState.currentQuestion.id,
    },
    include: { player: true },
    orderBy: { rank: 'asc' }
  });

  const ranks = buzzes.map(buzz => ({
    playerId: buzz.playerId,
    timeMs: buzz.timeMs,
  }));

  const io = require('socket.io').Server;
  io.to(roomCode).emit('server:buzzRankings', {
    questionId: roomState.currentQuestion.id,
    ranks,
  });
}

async function broadcastLeaderboard(roomCode: string) {
  const roomState = roomStates.get(roomCode);
  if (!roomState) return;

  const players = roomState.players
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((player, index) => ({
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      rank: index + 1,
    }));

  const leaderboard: LeaderboardData = { players };

  if (roomState.settings.teamMode) {
    // Calculate team scores
    const teamScores = new Map<string, number>();
    roomState.players.forEach(player => {
      if (player.teamId) {
        const current = teamScores.get(player.teamId) || 0;
        teamScores.set(player.teamId, current + player.score);
      }
    });

    const teams = Array.from(teamScores.entries())
      .map(([teamId, score]) => {
        const team = roomState.teams.find(t => t.id === teamId);
        return {
          teamId,
          name: team?.name || 'Unknown',
          score,
          rank: 0, // Will be set after sorting
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    leaderboard.teams = teams;
  }

  const io = require('socket.io').Server;
  io.to(roomCode).emit('server:leaderboard', leaderboard);
}

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(socketId);
  
  if (!limit || now > limit.resetTime) {
    rateLimits.set(socketId, { count: 1, resetTime: now + 1000 });
    return false;
  }
  
  if (limit.count >= 10) { // 10 requests per second
    return true;
  }
  
  limit.count++;
  return false;
}
