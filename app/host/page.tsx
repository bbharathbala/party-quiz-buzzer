'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HostConsole() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const authenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/host/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid PIN');
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Host Console
            </h1>
            <p className="text-gray-600">Enter admin PIN to continue</p>
          </div>

          <form onSubmit={authenticate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter admin PIN"
                className="input-field text-center text-lg font-mono tracking-wider"
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
              disabled={isLoading || !pin.trim()}
              className="btn-primary w-full"
            >
              {isLoading ? 'Authenticating...' : 'Enter Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Host Console</h1>
            <p className="text-gray-600">Manage your quiz game</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Management */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Content Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/host/categories')}
                  className="btn-primary"
                >
                  Manage Categories
                </button>
                <button
                  onClick={() => router.push('/host/questions')}
                  className="btn-primary"
                >
                  Manage Questions
                </button>
                <button
                  onClick={() => router.push('/host/rounds')}
                  className="btn-primary"
                >
                  Build Rounds
                </button>
                <button
                  onClick={() => router.push('/host/import-export')}
                  className="btn-primary"
                >
                  Import/Export
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Game Control</h2>
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/host/create-room')}
                  className="btn-success w-full"
                >
                  Create New Room
                </button>
                <button
                  onClick={() => router.push('/host/active-rooms')}
                  className="btn-secondary w-full"
                >
                  Active Rooms
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="btn-secondary w-full">
                  View Statistics
                </button>
                <button className="btn-secondary w-full">
                  System Settings
                </button>
                <button className="btn-secondary w-full">
                  Help & Support
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Next Question</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">N</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Previous</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">P</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Pause/Resume</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Reveal</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">R</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Leaderboard</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">L</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Start Buzzer</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded">B</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
