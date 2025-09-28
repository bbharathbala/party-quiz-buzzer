'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

export default function Confetti({ show, onComplete }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: ['#f59e0b', '#3b82f6', '#ef4444', '#22c55e', '#a855f7'][Math.floor(Math.random() * 5)],
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || pieces.length === 0) return null;

  return (
    <div className="confetti">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.x,
            top: piece.y,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}
