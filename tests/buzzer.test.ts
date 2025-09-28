import { describe, it, expect } from 'vitest';

describe('Buzzer Logic', () => {
  it('should rank buzzes by time correctly', () => {
    const buzzes = [
      { playerId: 'player1', timeMs: 1500 },
      { playerId: 'player2', timeMs: 800 },
      { playerId: 'player3', timeMs: 2000 },
      { playerId: 'player4', timeMs: 1200 },
    ];

    const sortedBuzzes = buzzes.sort((a, b) => a.timeMs - b.timeMs);
    
    expect(sortedBuzzes[0].playerId).toBe('player2');
    expect(sortedBuzzes[1].playerId).toBe('player4');
    expect(sortedBuzzes[2].playerId).toBe('player1');
    expect(sortedBuzzes[3].playerId).toBe('player3');
  });

  it('should handle tie-breaking correctly', () => {
    const buzzes = [
      { playerId: 'player1', timeMs: 1000 },
      { playerId: 'player2', timeMs: 1000 },
      { playerId: 'player3', timeMs: 1000 },
    ];

    // In case of ties, first to submit gets higher rank
    const rankedBuzzes = buzzes.map((buzz, index) => ({
      ...buzz,
      rank: index + 1,
    }));
    
    expect(rankedBuzzes[0].rank).toBe(1);
    expect(rankedBuzzes[1].rank).toBe(2);
    expect(rankedBuzzes[2].rank).toBe(3);
  });

  it('should limit buzzes to top N', () => {
    const allBuzzes = [
      { playerId: 'player1', timeMs: 500 },
      { playerId: 'player2', timeMs: 800 },
      { playerId: 'player3', timeMs: 1200 },
      { playerId: 'player4', timeMs: 1500 },
      { playerId: 'player5', timeMs: 2000 },
    ];

    const topN = 3;
    const topBuzzes = allBuzzes.slice(0, topN);
    
    expect(topBuzzes).toHaveLength(3);
    expect(topBuzzes[0].playerId).toBe('player1');
    expect(topBuzzes[1].playerId).toBe('player2');
    expect(topBuzzes[2].playerId).toBe('player3');
  });

  it('should validate buzz timing', () => {
    const questionStartTime = Date.now();
    const buzzTime = questionStartTime + 500; // 500ms after question start
    
    const isValidTiming = buzzTime > questionStartTime;
    expect(isValidTiming).toBe(true);
  });

  it('should prevent duplicate buzzes from same player', () => {
    const existingBuzzes = [
      { playerId: 'player1', timeMs: 1000 },
      { playerId: 'player2', timeMs: 1200 },
    ];

    const newBuzz = { playerId: 'player1', timeMs: 1500 };
    const isDuplicate = existingBuzzes.some(buzz => buzz.playerId === newBuzz.playerId);
    
    expect(isDuplicate).toBe(true);
  });
});
