'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents, RoomState, QuestionPublic, LeaderboardData } from '../../../types/shared';

export default function RoomDisplay() {
  const params = useParams();
  const roomCode = params.code as string;
  
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPublic | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [buzzRankings, setBuzzRankings] = useState<Array<{ playerId: string; timeMs: number }>>([]);

  useEffect(() => {
    const newSocket = io(`/room/${roomCode}`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to room display:', roomCode);
    });

    newSocket.on('server:roomState', (state) => {
      setRoomState(state);
    });

    newSocket.on('server:question', (question) => {
      setCurrentQuestion(question);
      setIsRevealed(false);
      setBuzzRankings([]);
    });

    newSocket.on('server:time', (data) => {
      setTimeRemaining(data.timeRemainingMs);
    });

    newSocket.on('server:reveal', (data) => {
      setIsRevealed(true);
      // Handle reveal data (correct answers, distribution, etc.)
    });

    newSocket.on('server:leaderboard', (data) => {
      setLeaderboard(data);
    });

    newSocket.on('server:buzzRankings', (data) => {
      setBuzzRankings(data.ranks);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode]);

  const startQuestion = (questionId: string) => {
    if (socket) {
      socket.emit('host:startQuestion', { questionId });
    }
  };

  const startBuzzer = (questionId: string) => {
    if (socket) {
      socket.emit('host:startBuzzer', { questionId, topN: 3 });
    }
  };

  const revealAnswers = () => {
    if (socket && currentQuestion) {
      socket.emit('host:reveal', { questionId: currentQuestion.id });
    }
  };

  const showLeaderboard = () => {
    if (socket) {
      socket.emit('host:showLeaderboard');
    }
  };

  const pauseTimer = () => {
    if (socket) {
      socket.emit('host:pauseTimer');
    }
  };

  const resumeTimer = () => {
    if (socket) {
      socket.emit('host:resumeTimer');
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${remainingSeconds}s`;
  };

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Room {roomCode}</h1>
            <p className="text-gray-400">
              {roomState.players.length} player{roomState.players.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-400">
              {roomState.status === 'lobby' ? 'Lobby' : 
               roomState.status === 'in_progress' ? 'In Progress' :
               roomState.status === 'paused' ? 'Paused' : 'Ended'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {roomState.status === 'lobby' && (
          <div className="text-center py-20">
            <h2 className="text-6xl font-bold mb-8">Waiting for Players</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {roomState.players.map((player) => (
                <div key={player.id} className="bg-white text-gray-900 p-6 rounded-xl">
                  <div className="text-4xl mb-2">{player.avatar}</div>
                  <div className="font-semibold">{player.nickname}</div>
                  {player.isHost && (
                    <div className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded mt-2">
                      Host
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {roomState.status === 'in_progress' && currentQuestion && (
          <div className="space-y-8">
            {/* Timer */}
            <div className="text-center">
              <div className="timer-display text-primary-400 mb-4">
                {formatTime(timeRemaining)}
              </div>
              {timeRemaining <= 5000 && timeRemaining > 0 && (
                <div className="text-2xl text-danger-400 animate-pulse-fast">
                  Time's Running Out!
                </div>
              )}
            </div>

            {/* Question */}
            <div className="card bg-white text-gray-900 max-w-4xl mx-auto">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">{currentQuestion.prompt}</h2>
                
                {currentQuestion.imageUrl && (
                  <div className="mb-6">
                    <img 
                      src={currentQuestion.imageUrl} 
                      alt="Question image"
                      className="max-w-full h-auto rounded-lg mx-auto"
                    />
                  </div>
                )}

                {currentQuestion.type === 'buzzer' && (
                  <div className="text-center">
                    <div className="text-6xl font-bold text-danger-500 mb-4">BUZZ IN!</div>
                    <div className="text-2xl text-gray-600">
                      First {buzzRankings.length > 0 ? buzzRankings.length : 3} players to buzz
                    </div>
                  </div>
                )}

                {currentQuestion.options && currentQuestion.type !== 'buzzer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={option.id}
                        className={`p-4 rounded-lg border-2 text-left ${
                          isRevealed ? 'border-success-500 bg-success-100' : 'border-gray-200'
                        }`}
                      >
                        <div className="font-semibold">
                          {String.fromCharCode(65 + index)}. {option.text}
                        </div>
                        {option.imageUrl && (
                          <img 
                            src={option.imageUrl} 
                            alt="Option image"
                            className="mt-2 max-w-full h-auto rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Buzz Rankings */}
            {currentQuestion.type === 'buzzer' && buzzRankings.length > 0 && (
              <div className="card bg-white text-gray-900 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-4">Buzz Rankings</h3>
                <div className="space-y-2">
                  {buzzRankings.map((buzz, index) => {
                    const player = roomState.players.find(p => p.id === buzz.playerId);
                    return (
                      <div key={buzz.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-primary-600">#{index + 1}</span>
                          <span className="text-2xl">{player?.avatar}</span>
                          <span className="font-semibold">{player?.nickname}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {(buzz.timeMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard && (
              <div className="card bg-white text-gray-900 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-4">Leaderboard</h3>
                <div className="space-y-2">
                  {leaderboard.players.slice(0, 10).map((player, index) => (
                    <div key={player.playerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-primary-600">#{index + 1}</span>
                        <span className="font-semibold">{player.nickname}</span>
                      </div>
                      <span className="text-lg font-bold text-primary-600">{player.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Host Controls */}
        <div className="fixed bottom-4 right-4 space-x-2">
          <button
            onClick={pauseTimer}
            className="btn-secondary"
          >
            Pause
          </button>
          <button
            onClick={resumeTimer}
            className="btn-primary"
          >
            Resume
          </button>
          <button
            onClick={revealAnswers}
            className="btn-success"
          >
            Reveal
          </button>
          <button
            onClick={showLeaderboard}
            className="btn-secondary"
          >
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
