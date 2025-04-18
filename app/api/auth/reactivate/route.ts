import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';

// GET /api/auth/reactivate?email=email@example.com
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.redirect(new URL('/?error=invalid_reactivation', request.url));
    }
    
    // Trova l'utente
    const user = await UserService.findUserByEmail(email);
    
    if (!user) {
      return NextResponse.redirect(new URL('/?error=user_not_found', request.url));
    }
    
    // Riattiva l'account e imposta come verificato
    await UserService.updateUnsubscribeStatus(email, false);
    
    // Se l'utente non è verificato, lo verifichiamo
    if (!user.isVerified) {
      await UserService.updateVerificationStatus(email, true);
    }
    
    // Reindirizza alla pagina di conferma riattivazione
    return NextResponse.redirect(new URL('/reactivation-success', request.url));
  } catch (error) {
    console.error('Errore nella riattivazione dell\'account:', error);
    return NextResponse.redirect(new URL('/?error=reactivation_failed', request.url));
  }
} 