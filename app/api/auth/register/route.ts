import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import { sendVerificationEmail, sendReactivationEmail } from '@/lib/email';

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

    // Controlla se l'utente esiste già
    const existingUser = await UserService.findUserByEmail(email);

    // Se esiste ed è in stato unsubscribed, invia email di riattivazione
    if (existingUser && existingUser.unsubscribed) {
      // Invia email di riattivazione invece di riattivare subito
      await sendReactivationEmail(email, nickname);
      
      return NextResponse.json(
        { success: true, message: 'Reactivation email sent! Check your inbox.' },
        { status: 200 }
      );
    }
    
    // Se esiste ed è già attivo, mostra errore
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Crea un nuovo utente
    const newUser = await UserService.createUser({
      email,
      nickname,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isApproved: false,
      unsubscribed: false
    });

    // Invia email di verifica
    await sendVerificationEmail(email, nickname);

    return NextResponse.json(
      { success: true, message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error registering user' },
      { status: 500 }
    );
  }
} 