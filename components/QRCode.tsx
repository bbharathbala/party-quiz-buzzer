'use client';

import { useEffect, useState } from 'react';
import { generateQRCode } from '../lib/utils';

interface QRCodeProps {
  text: string;
  size?: number;
  className?: string;
}

export default function QRCode({ text, size = 256, className = '' }: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode(text).then(setQrDataUrl);
  }, [text]);

  if (!qrDataUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="QR Code"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
