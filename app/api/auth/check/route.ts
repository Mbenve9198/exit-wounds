import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { UserService } from '@/lib/services/UserService';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'exit-wounds-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
    
    // Verify token
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      const userId = payload.id as string;
      
      // Check if user exists
      const user = await UserService.findUserById(userId);
      if (!user) {
        return NextResponse.json(
          { authenticated: false },
          { status: 401 }
        );
      }
      
      // Return user info (excluding sensitive data)
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname
        }
      });
    } catch (err) {
      // Invalid token
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 