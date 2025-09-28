import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export function getHostToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get('host-token')?.value || null;
}

export function verifyHostToken(request?: NextRequest): boolean {
  const token = request 
    ? request.cookies.get('host-token')?.value
    : getHostToken();
  
  return !!token;
}

export function requireHostAuth(request?: NextRequest): boolean {
  return verifyHostToken(request);
}
