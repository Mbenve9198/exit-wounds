import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();
    console.log('Registration attempt:', { email, nickname });
    
    if (!email || !password || !nickname) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Email, password and nickname are required' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    console.log('Checking if user exists...');
    const existingUser = await UserService.findUserByEmail(email);
    if (existingUser) {
      console.log('User already exists');
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Crea il nuovo utente
    console.log('Creating new user...');
    const newUser = await UserService.createUser({
      email,
      password,
      nickname,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('User created:', newUser._id);

    // Invia email di verifica
    console.log('Sending verification email...');
    const emailSent = await sendVerificationEmail(email, nickname);
    if (!emailSent) {
      console.error('Failed to send verification email');
      // Non blocchiamo la registrazione se l'email non viene inviata
      // L'utente può richiedere un nuovo invio in seguito
    }

    return NextResponse.json(
      { 
        message: 'Registration complete. Check your email to confirm your subscription.',
        userId: newUser._id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 