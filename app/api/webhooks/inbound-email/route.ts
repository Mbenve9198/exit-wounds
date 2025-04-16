import { NextResponse } from 'next/server';
import { UserService } from '@/lib/services/UserService';
import { Resend } from 'resend';

const resend = new Resend('re_L8nxLPsh_AFgnAHfpPmnq1mwezan3Dws4');

// Lista di parole chiave che potrebbero indicare una risposta generica o spam
const spamIndicators = [
  'unsubscribe',
  'opt-out',
  'remove',
  'stop',
  'cancel',
  'spam',
  'marketing',
  'advertisement',
  'promotion'
];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Estrai l'email del mittente e il contenuto del messaggio
    const fromEmail = data.from;
    const messageContent = data.text || data.html;

    // Pulisci il contenuto del messaggio
    const cleanContent = messageContent
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Verifica se la risposta è valida (almeno 5 parole)
    const wordCount = cleanContent.split(' ').filter((word: string) => word.length > 0).length;
    const isValidResponse = wordCount >= 5;

    if (isValidResponse) {
      // Trova l'utente per email
      const user = await UserService.findUserByEmail(fromEmail);
      
      if (user && !user.isVerified) {
        // Verifica l'utente
        await UserService.updateUser(user._id!.toString(), {
          isVerified: true,
          verificationToken: null
        });

        // Invia email di benvenuto
        await sendWelcomeEmail(fromEmail);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nella gestione della risposta email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

function isHumanResponse(content: string): boolean {
  // Rimuovi le firme e i saluti
  const cleanContent = content
    .replace(/best regards.*$/i, '')
    .replace(/regards.*$/i, '')
    .replace(/thanks.*$/i, '')
    .replace(/thank you.*$/i, '')
    .replace(/sincerely.*$/i, '')
    .replace(/cheers.*$/i, '')
    .trim();

  // Verifica se il contenuto è troppo corto (probabilmente una risposta automatica)
  if (cleanContent.length < 20) {
    return false;
  }

  // Verifica se contiene indicatori di spam
  if (spamIndicators.some(indicator => cleanContent.includes(indicator))) {
    return false;
  }

  // Verifica se contiene parole chiave che indicano una risposta umana
  const humanIndicators = [
    'startup',
    'fail',
    'failed',
    'failure',
    'success',
    'journey',
    'experience',
    'learn',
    'learned',
    'story',
    'adventure',
    'challenge',
    'struggle',
    'growth',
    'passion',
    'dream',
    'vision',
    'mission',
    'purpose',
    'impact'
  ];

  const hasHumanIndicators = humanIndicators.some(indicator => 
    cleanContent.includes(indicator)
  );

  // Verifica se contiene segni di formattazione umana
  const hasHumanFormatting = 
    content.includes(' ') && // Contiene spazi
    content.includes('.') && // Contiene punti
    content.includes(',') && // Contiene virgole
    !!content.match(/[A-Z]/) && // Contiene maiuscole
    !!content.match(/[a-z]/); // Contiene minuscole

  return hasHumanIndicators && hasHumanFormatting;
}

async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: 'marco@exit-wounds.com',
      to: email,
      subject: 'Welcome to the Misfits Club!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to the Misfits Club!</h1>
          
          <p>Your subscription to Exit Wounds is now confirmed. Get ready for:</p>
          
          <ul>
            <li>Weekly doses of startup trauma therapy</li>
            <li>AI-powered insights that might actually help</li>
            <li>BJJ adventures of a 65kg guy</li>
          </ul>
          
          <p>First issue coming soon to your inbox!</p>
          
          <p>Until then, remember: "Tap before you nap, but never tap to life."</p>
          
          <p>Marco<br>
          Ex-founder, Eternal White Belt & AI Whisperer</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di benvenuto:', error);
  }
} 