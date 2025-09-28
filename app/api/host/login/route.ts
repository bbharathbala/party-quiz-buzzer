import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    
    if (!pin) {
      return NextResponse.json(
        { message: 'PIN is required' },
        { status: 400 }
      );
    }

    const adminPin = process.env.ADMIN_PIN;
    if (!adminPin) {
      return NextResponse.json(
        { message: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (pin !== adminPin) {
      return NextResponse.json(
        { message: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Generate host token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('host-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in host login:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
