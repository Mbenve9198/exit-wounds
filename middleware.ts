import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'exit-wounds-secret-key';

// Funzione per verificare il token JWT utilizzando jose
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Middleware di autenticazione
export async function middleware(request: NextRequest) {
  // Aggiungiamo sempre l'header per file di grandi dimensioni
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-allow-large-payloads', 'true');
  
  // Percorsi da proteggere
  const isProtectedPath = request.nextUrl.pathname.startsWith('/comics');
  
  // Se non è un percorso protetto, lascia passare con l'header personalizzato
  if (!isProtectedPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Home page dei fumetti è accessibile a tutti
  if (request.nextUrl.pathname === '/comics') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Verifica token di autenticazione
  const token = request.cookies.get('auth_token')?.value;
  
  // Se non c'è token e siamo in un percorso protetto, reindirizza alla pagina comics
  if (!token) {
    // Reindirizza alla home con un flag per mostrare il login
    const url = new URL('/comics', request.url);
    url.searchParams.set('showLogin', 'true');
    return NextResponse.redirect(url);
  }
  
  // Verifica validità del token
  const decodedToken = await verifyToken(token);
  if (!decodedToken) {
    // Token non valido, reindirizza con flag per login
    const url = new URL('/comics', request.url);
    url.searchParams.set('showLogin', 'true');
    return NextResponse.redirect(url);
  }
  
  // Utente autenticato, permetti l'accesso con l'header personalizzato
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configurazione dei percorsi per il middleware
export const config = {
  matcher: ['/comics/:path*', '/api/admin/comics'], // Match comics paths and large payload API
}; 