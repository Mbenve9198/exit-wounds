import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await UserService.findUserByEmail(email);
    
    // If user not found, still return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email exists in our system, we've sent password reset instructions."
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiration
    
    // Save reset token to user
    await UserService.setResetPasswordToken(email, resetToken, resetExpires);
    
    // Send reset email
    await sendResetPasswordEmail(email, user.nickname, resetToken);
    
    return NextResponse.json({
      success: true,
      message: "If that email exists in our system, we've sent password reset instructions."
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Something went terribly wrong. Like your startup, but faster.' },
      { status: 500 }
    );
  }
} 