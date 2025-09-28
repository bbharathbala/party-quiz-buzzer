import { Question, RoomSettings } from '../types/shared';

export function calculateScore(
  question: Question,
  timeMs: number,
  settings?: RoomSettings,
  streakCount: number = 0
): number {
  let baseScore = question.points;
  
  if (!settings) {
    return baseScore;
  }
  
  // Speed bonus
  if (settings.speedBonus && question.timeLimitSeconds > 0) {
    const timeLimitMs = question.timeLimitSeconds * 1000;
    const timeRatio = timeMs / timeLimitMs;
    const speedBonus = Math.floor(baseScore * 0.5 * (1 - timeRatio));
    baseScore += Math.max(0, speedBonus);
  }
  
  // Streak bonus
  if (settings.streakBonus && streakCount > 0) {
    baseScore += streakCount * 10;
  }
  
  return baseScore;
}

export function calculateTeamScore(players: Array<{ score: number; teamId?: string }>): Map<string, number> {
  const teamScores = new Map<string, number>();
  
  players.forEach(player => {
    if (player.teamId) {
      const current = teamScores.get(player.teamId) || 0;
      teamScores.set(player.teamId, current + player.score);
    }
  });
  
  return teamScores;
}

export function calculateLeaderboard(
  players: Array<{ id: string; nickname: string; score: number; teamId?: string }>,
  teams?: Array<{ id: string; name: string; color: string }>
): {
  players: Array<{ playerId: string; nickname: string; score: number; rank: number }>;
  teams?: Array<{ teamId: string; name: string; score: number; rank: number }>;
} {
  // Sort players by score
  const sortedPlayers = players
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      playerId: player.id,
      nickname: player.nickname,
      score: player.score,
      rank: index + 1,
    }));
  
  let teamLeaderboard;
  if (teams && teams.length > 0) {
    const teamScores = calculateTeamScore(players);
    const sortedTeams = Array.from(teamScores.entries())
      .map(([teamId, score]) => {
        const team = teams.find(t => t.id === teamId);
        return {
          teamId,
          name: team?.name || 'Unknown',
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));
    
    teamLeaderboard = sortedTeams;
  }
  
  return {
    players: sortedPlayers,
    teams: teamLeaderboard,
  };
}
