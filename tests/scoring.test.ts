import { describe, it, expect } from 'vitest';
import { calculateScore, calculateTeamScore, calculateLeaderboard } from '../lib/scoring';
import { RoomSettings } from '../types/shared';

describe('Scoring Functions', () => {
  const mockQuestion = {
    id: '1',
    type: 'single',
    prompt: 'Test question',
    timeLimitSeconds: 20,
    points: 100,
  };

  const defaultSettings: RoomSettings = {
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

  it('should calculate flat score without bonuses', () => {
    const score = calculateScore(mockQuestion, 10000, defaultSettings, 0);
    expect(score).toBe(100);
  });

  it('should calculate speed bonus correctly', () => {
    const settingsWithSpeedBonus = {
      ...defaultSettings,
      speedBonus: true,
    };
    
    // Fast answer (5 seconds out of 20)
    const fastScore = calculateScore(mockQuestion, 5000, settingsWithSpeedBonus, 0);
    expect(fastScore).toBeGreaterThan(100);
    
    // Slow answer (15 seconds out of 20)
    const slowScore = calculateScore(mockQuestion, 15000, settingsWithSpeedBonus, 0);
    expect(slowScore).toBeLessThan(fastScore);
  });

  it('should calculate streak bonus correctly', () => {
    const settingsWithStreakBonus = {
      ...defaultSettings,
      streakBonus: true,
    };
    
    const scoreWithStreak = calculateScore(mockQuestion, 10000, settingsWithStreakBonus, 3);
    expect(scoreWithStreak).toBe(130); // 100 + (3 * 10)
  });

  it('should calculate team scores correctly', () => {
    const players = [
      { score: 100, teamId: 'team1' },
      { score: 150, teamId: 'team1' },
      { score: 200, teamId: 'team2' },
      { score: 50, teamId: 'team2' },
      { score: 75, teamId: undefined }, // No team
    ];

    const teamScores = calculateTeamScore(players);
    
    expect(teamScores.get('team1')).toBe(250);
    expect(teamScores.get('team2')).toBe(250);
    expect(teamScores.get(undefined)).toBeUndefined();
  });

  it('should calculate leaderboard correctly', () => {
    const players = [
      { id: '1', nickname: 'Alice', score: 300, teamId: 'team1' },
      { id: '2', nickname: 'Bob', score: 250, teamId: 'team1' },
      { id: '3', nickname: 'Charlie', score: 200, teamId: 'team2' },
      { id: '4', nickname: 'Diana', score: 150, teamId: 'team2' },
    ];

    const teams = [
      { id: 'team1', name: 'Team Alpha', color: 'blue' },
      { id: 'team2', name: 'Team Beta', color: 'red' },
    ];

    const leaderboard = calculateLeaderboard(players, teams);
    
    expect(leaderboard.players).toHaveLength(4);
    expect(leaderboard.players[0].nickname).toBe('Alice');
    expect(leaderboard.players[0].rank).toBe(1);
    expect(leaderboard.players[0].score).toBe(300);
    
    expect(leaderboard.teams).toHaveLength(2);
    expect(leaderboard.teams![0].name).toBe('Team Alpha');
    expect(leaderboard.teams![0].score).toBe(550); // 300 + 250
    expect(leaderboard.teams![0].rank).toBe(1);
  });
});
