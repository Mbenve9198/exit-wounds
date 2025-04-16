import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();
    
    if (!email || !password || !nickname) {
      return NextResponse.json(
        { error: 'Email, password e nickname sono obbligatorie' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste già
    const existingUser = await UserService.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }
    
    // Crea il nuovo utente
    const newUser = await UserService.createUser({
      email,
      password,
      nickname,
      isVerified: false
    });

    // Invia email di verifica
    await sendVerificationEmail(email);

    return NextResponse.json(
      { 
        message: 'Registrazione completata. Controlla la tua email per la verifica.',
        userId: newUser._id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Errore nella registrazione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 