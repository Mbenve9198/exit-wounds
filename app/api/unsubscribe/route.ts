import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { UserService } from '@/lib/services/UserService';
import { redirect } from 'next/navigation';

// GET /api/unsubscribe?token=XYZ
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    
    if (!token && !email) {
      return NextResponse.redirect(new URL('/?error=invalid_unsubscribe', request.url));
    }
    
    // Proviamo prima con il token se disponibile
    if (token) {
      const user = await UserService.findUserByUnsubscribeToken(token);
      
      if (user) {
        // Aggiorna l'utente come unsubscribed
        await UserService.updateUnsubscribeStatus(user.email, true);
        
        // Reindirizza alla pagina di conferma
        return NextResponse.redirect(new URL('/unsubscribe-success', request.url));
      }
    }
    
    // Fallback usando l'email
    if (email) {
      // Aggiorna l'utente come unsubscribed
      await UserService.updateUnsubscribeStatus(email, true);
      
      // Reindirizza alla pagina di conferma
      return NextResponse.redirect(new URL('/unsubscribe-success', request.url));
    }
    
    return NextResponse.redirect(new URL('/?error=invalid_unsubscribe', request.url));
  } catch (error) {
    console.error('Errore nella gestione dell\'unsubscribe:', error);
    return NextResponse.redirect(new URL('/?error=unsubscribe_failed', request.url));
  }
} 