'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  timeRemainingMs: number;
  className?: string;
}

export default function Timer({ timeRemainingMs, className = '' }: TimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemainingMs);

  useEffect(() => {
    setDisplayTime(timeRemainingMs);
  }, [timeRemainingMs]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${remainingSeconds}s`;
  };

  const getTimeColor = (ms: number) => {
    if (ms <= 5000) return 'text-danger-500';
    if (ms <= 10000) return 'text-warning-500';
    return 'text-primary-500';
  };

  const isUrgent = timeRemainingMs <= 5000 && timeRemainingMs > 0;

  return (
    <div className={`text-center ${className}`}>
      <div className={`timer-display ${getTimeColor(displayTime)} ${isUrgent ? 'animate-pulse-fast' : ''}`}>
        {formatTime(displayTime)}
      </div>
      {isUrgent && (
        <div className="text-2xl text-danger-500 animate-pulse-fast mt-2">
          Time's Running Out!
        </div>
      )}
    </div>
  );
}
