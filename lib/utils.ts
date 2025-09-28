import crypto from 'crypto';

// Generate room code excluding ambiguous characters
export function generateRoomCode(length: number = 5): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes O, 0, I, 1
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Generate QR code data URL
export async function generateQRCode(text: string): Promise<string> {
  const QRCode = require('qrcode');
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

// Create signed JSON for import/export
export function createSignedJSON(data: any, secret: string): string {
  const jsonString = JSON.stringify(data);
  const signature = crypto.createHmac('sha256', secret).update(jsonString).digest('hex');
  return JSON.stringify({ data, signature });
}

// Verify signed JSON
export function verifySignedJSON(signedJson: string, secret: string): any {
  try {
    const parsed = JSON.parse(signedJson);
    const { data, signature } = parsed;
    
    const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    return data;
  } catch (error) {
    throw new Error('Invalid signed JSON');
  }
}

// Validate file upload
export function validateFileUpload(file: { size: number; mimetype: string }): { valid: boolean; error?: string } {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 2MB)' };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type (only JPEG, PNG, GIF allowed)' };
  }
  
  return { valid: true };
}

// Calculate ping/latency
export function calculateLatency(sentTime: number, receivedTime: number): number {
  return receivedTime - sentTime;
}

// Format time for display
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${remainingSeconds}s`;
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
