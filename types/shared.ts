import { z } from 'zod';

// Room Settings
export type RoomSettings = {
  allowAnswerChange: boolean;
  speedBonus: boolean;
  streakBonus: boolean;
  teamMode: boolean;
  buzzerTopN: number;
  defaultTimeLimits: {
    single: number;
    multi: number;
    text: number;
    poll: number;
    buzzer: number;
  };
  points: {
    single: number;
    multi: number;
    text: number;
    poll: number;
    buzzer: number;
  };
};

// Public types (what clients see)
export type PlayerPublic = {
  id: string;
  nickname: string;
  avatar?: string;
  isHost: boolean;
  teamId?: string;
  score: number;
};

export type TeamPublic = {
  id: string;
  name: string;
  color: string;
  score: number;
};

export type Question = {
  id: string;
  type: string;
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  timeLimitSeconds: number;
  points: number;
  options?: OptionPublic[];
};

export type QuestionPublic = {
  id: string;
  type: string;
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  timeLimitSeconds: number;
  points: number;
  options?: OptionPublic[];
};

export type OptionPublic = {
  id: string;
  text: string;
  imageUrl?: string;
};

export type RoomState = {
  code: string;
  status: string;
  players: PlayerPublic[];
  teams: TeamPublic[];
  currentQuestion?: QuestionPublic;
  timeRemainingMs?: number;
  questionStartTime?: number;
  settings: RoomSettings;
};

export type LeaderboardData = {
  players: Array<{
    playerId: string;
    nickname: string;
    score: number;
    rank: number;
  }>;
  teams?: Array<{
    teamId: string;
    name: string;
    score: number;
    rank: number;
  }>;
};

export type Distribution = {
  [optionId: string]: number;
};

// Socket.IO Event Types
export interface ServerToClientEvents {
  'server:roomState': (data: RoomState) => void;
  'server:playerJoined': (data: { player: PlayerPublic }) => void;
  'server:question': (data: QuestionPublic) => void;
  'server:time': (data: { questionId: string; timeRemainingMs: number }) => void;
  'server:reveal': (data: {
    questionId: string;
    correctOptionIds?: string[];
    distribution?: Distribution;
    explanation?: string;
  }) => void;
  'server:leaderboard': (data: LeaderboardData) => void;
  'server:buzzRankings': (data: {
    questionId: string;
    ranks: Array<{ playerId: string; timeMs: number }>;
  }) => void;
  'server:error': (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'player:join': (data: { nickname: string; avatar?: string }) => void;
  'player:answer': (data: {
    questionId: string;
    optionIds?: string[];
    textAnswer?: string;
  }) => void;
  'player:buzz': (data: { questionId: string }) => void;
  'host:createRoom': (data: { settings?: Partial<RoomSettings> }) => void;
  'host:startQuestion': (data: { questionId: string }) => void;
  'host:pauseTimer': () => void;
  'host:resumeTimer': () => void;
  'host:reveal': (data: { questionId: string }) => void;
  'host:startBuzzer': (data: { questionId: string; topN?: number }) => void;
  'host:markCorrect': (data: { questionId: string; playerId: string }) => void;
  'host:nextQuestion': () => void;
  'host:showLeaderboard': () => void;
}

// Validation schemas
export const PlayerJoinSchema = z.object({
  nickname: z.string().min(1).max(20),
  avatar: z.string().optional(),
});

export const PlayerAnswerSchema = z.object({
  questionId: z.string(),
  optionIds: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
});

export const PlayerBuzzSchema = z.object({
  questionId: z.string(),
});

export const HostCreateRoomSchema = z.object({
  settings: z.object({
    allowAnswerChange: z.boolean().optional(),
    speedBonus: z.boolean().optional(),
    streakBonus: z.boolean().optional(),
    teamMode: z.boolean().optional(),
    buzzerTopN: z.number().min(1).max(10).optional(),
    defaultTimeLimits: z.object({
      single: z.number().min(5).max(300).optional(),
      multi: z.number().min(5).max(300).optional(),
      text: z.number().min(5).max(300).optional(),
      poll: z.number().min(5).max(300).optional(),
      buzzer: z.number().min(5).max(300).optional(),
    }).optional(),
    points: z.object({
      single: z.number().min(1).max(1000).optional(),
      multi: z.number().min(1).max(1000).optional(),
      text: z.number().min(1).max(1000).optional(),
      poll: z.number().min(1).max(1000).optional(),
      buzzer: z.number().min(1).max(1000).optional(),
    }).optional(),
  }).optional(),
});

export const HostStartQuestionSchema = z.object({
  questionId: z.string(),
});

export const HostRevealSchema = z.object({
  questionId: z.string(),
});

export const HostStartBuzzerSchema = z.object({
  questionId: z.string(),
  topN: z.number().min(1).max(10).optional(),
});

export const HostMarkCorrectSchema = z.object({
  questionId: z.string(),
  playerId: z.string(),
});

// Default room settings
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  allowAnswerChange: true,
  speedBonus: false,
  streakBonus: false,
  teamMode: false,
  buzzerTopN: 1,
  defaultTimeLimits: {
    single: 20,
    multi: 30,
    text: 30,
    poll: 15,
    buzzer: 10,
  },
  points: {
    single: 100,
    multi: 100,
    text: 100,
    poll: 50,
    buzzer: 200,
  },
};
