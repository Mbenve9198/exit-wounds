import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Aggiungiamo un header personalizzato per informare l'API che può accettare file più grandi
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-allow-large-payloads', 'true');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: '/api/admin/comics',
}; 