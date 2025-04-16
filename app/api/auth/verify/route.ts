import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token di verifica mancante' },
        { status: 400 }
      );
    }

    // Verifica l'utente
    const user = await UserService.verifyUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Token di verifica non valido' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Email verificata con successo',
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Errore nella verifica:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 