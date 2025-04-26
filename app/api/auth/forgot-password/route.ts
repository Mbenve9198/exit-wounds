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
    
    console.log('Processing forgot password request for email:', email);
    
    // Find user by email
    const user = await UserService.findUserByEmail(email);
    
    // If user not found, still return success to prevent email enumeration
    if (!user) {
      console.log('User not found with email:', email);
      return NextResponse.json({
        success: true,
        message: "If that email exists in our system, we've sent password reset instructions."
      });
    }
    
    console.log('User found:', user._id?.toString());
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiration
    
    console.log('Generated reset token:', resetToken, 'expires:', resetExpires);
    
    // Save reset token to user
    const tokenSaved = await UserService.setResetPasswordToken(email, resetToken, resetExpires);
    
    if (!tokenSaved) {
      console.error('Failed to save reset token for user:', email);
      return NextResponse.json(
        { error: 'Something went wrong saving your reset token' },
        { status: 500 }
      );
    }
    
    console.log('Reset token saved successfully for user:', email);
    
    // Send reset email
    try {
      await sendResetPasswordEmail(email, user.nickname || 'User', resetToken);
      console.log('Reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }
    
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