import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'exit-wounds-secret-key';
// Token expiration time (24 hours)
const TOKEN_EXPIRATION = 24 * 60 * 60; // secondi

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is verified and approved
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await UserService.updateUser(user._id!.toString(), {
      lastLogin: new Date(),
    });

    // Create JWT token with jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({
      id: user._id?.toString(),
      email: user.email,
      nickname: user.nickname,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Create response with success data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
      },
      message: 'Login successful'
    });

    // Set cookie in the response
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRATION, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
} 