'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents, RoomState } from '../types/shared';

export default function HomePage() {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const avatars = ['🎉', '🎂', '🎈', '🎁', '🎊', '🎵', '🎮', '🏆', '⭐', '💫'];

  useEffect(() => {
    // Check if we're already in a room (from URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('room');
    if (code) {
      setRoomCode(code);
    }
  }, []);

  const joinRoom = async () => {
    if (!nickname.trim() || !roomCode.trim()) {
      setError('Please enter both nickname and room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const newSocket = io(`/room/${roomCode.toUpperCase()}`, {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to room:', roomCode);
        newSocket.emit('player:join', {
          nickname: nickname.trim(),
          avatar: avatar || undefined,
        });
      });

      newSocket.on('server:roomState', (state) => {
        setRoomState(state);
        setSocket(newSocket);
        setIsJoining(false);
      });

      newSocket.on('server:error', (error) => {
        setError(error.message);
        setIsJoining(false);
        newSocket.disconnect();
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from room');
        setSocket(null);
        setRoomState(null);
      });

    } catch (err) {
      setError('Failed to connect to room');
      setIsJoining(false);
    }
  };

  const startGame = () => {
    if (socket && roomState) {
      router.push(`/room/${roomCode}`);
    }
  };

  if (socket && roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME}!
          </h1>
          
          <div className="mb-6">
            <div className="text-6xl mb-4">{avatar}</div>
            <h2 className="text-xl font-semibold text-gray-700">{nickname}</h2>
            <p className="text-gray-600">Room: {roomCode}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Players in Room:</h3>
            <div className="space-y-2">
              {roomState.players.map((player) => (
                <div key={player.id} className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="font-medium">{player.nickname}</span>
                  {player.isHost && <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">Host</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {roomState.status === 'lobby' 
                ? 'Waiting for host to start the game...'
                : 'Game is in progress!'
              }
            </p>
            
            {roomState.status === 'lobby' && (
              <button
                onClick={startGame}
                className="btn-primary w-full"
              >
                Go to Game View
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="text-gray-600">Join the party quiz game!</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); joinRoom(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="input-field"
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-5 gap-2">
              {avatars.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                    avatar === emoji
                      ? 'border-primary-500 bg-primary-100'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="input-field text-center text-lg font-mono tracking-wider"
              maxLength={5}
              required
            />
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining || !nickname.trim() || !roomCode.trim()}
            className="btn-primary w-full"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have a room code? Ask the host to share the QR code or room code.
          </p>
        </div>
      </div>
    </div>
  );
}
