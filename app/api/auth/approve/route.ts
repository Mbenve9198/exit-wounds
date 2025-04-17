import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import { sendApprovalEmail, addContactToAudience } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email mancante' },
        { status: 400 }
      );
    }

    // Trova l'utente
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Approva l'utente
    const updatedUser = await UserService.updateUser(user._id!.toString(), {
      isVerified: true,
      isApproved: true,
      approvedAt: new Date()
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Errore nell\'approvazione dell\'utente' },
        { status: 500 }
      );
    }

    // Aggiungi l'utente all'audience di Resend
    try {
      await addContactToAudience(email, user.nickname);
      console.log(`Utente ${email} aggiunto all'audience di Resend con successo!`);
    } catch (resendError) {
      console.error('Errore nell\'aggiunta dell\'utente all\'audience di Resend:', resendError);
      // Continuiamo con il processo anche se c'è un errore con Resend
    }

    // Invia email di conferma all'utente
    await sendApprovalEmail(email, user.nickname);

    // Reindirizza alla pagina di successo
    return NextResponse.redirect(new URL('/approval-success', request.url));
  } catch (error) {
    console.error('Errore nell\'approvazione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
} 