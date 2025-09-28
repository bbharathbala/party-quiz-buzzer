'use client';

import { LeaderboardData } from '../types/shared';

interface LeaderboardProps {
  data: LeaderboardData;
  showTeams?: boolean;
  className?: string;
}

export default function Leaderboard({ data, showTeams = false, className = '' }: LeaderboardProps) {
  return (
    <div className={`card ${className}`}>
      <h3 className="text-2xl font-bold text-center mb-6">Leaderboard</h3>
      
      {/* Players */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Players</h4>
        <div className="space-y-2">
          {data.players.map((player, index) => (
            <div key={player.playerId} className="leaderboard-item">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-primary-600">#{player.rank}</span>
                <span className="font-semibold">{player.nickname}</span>
              </div>
              <span className="text-lg font-bold text-primary-600">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Teams */}
      {showTeams && data.teams && data.teams.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">Teams</h4>
          <div className="space-y-2">
            {data.teams.map((team, index) => (
              <div key={team.teamId} className="leaderboard-item">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-primary-600">#{team.rank}</span>
                  <span className="font-semibold">{team.name}</span>
                </div>
                <span className="text-lg font-bold text-primary-600">{team.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
