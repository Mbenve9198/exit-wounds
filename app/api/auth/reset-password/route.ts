import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long. Make it stronger than your coffee.' },
        { status: 400 }
      );
    }
    
    // Reset password with token
    const user = await UserService.resetPassword(token, newPassword);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Like that investor check you were waiting for.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Remember it this time, or write it down somewhere insecure like everyone else."
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Something went terribly wrong. Like your startup, but faster.' },
      { status: 500 }
    );
  }
} 