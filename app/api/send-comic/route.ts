import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Comic } from '@/lib/models/Comic';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Funzione di autorizzazione admin
async function isAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_API_KEY) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Errore nella verifica admin:', error);
    return false;
  }
}

// POST /api/send-comic - Invia un fumetto via email
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { comicId } = await request.json();
    
    if (!comicId) {
      return NextResponse.json({ error: 'ID fumetto richiesto' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Recupero il fumetto
    const comic = await db.collection('comics').findOne({ _id: new ObjectId(comicId) }) as Comic;
    
    if (!comic) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }

    // Recupero tutti gli utenti approvati
    const users = await db.collection('users').find({ 
      isApproved: true, 
      isVerified: true 
    }).toArray();
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Nessun utente trovato per l\'invio' }, { status: 404 });
    }

    // Preparo l'HTML dell'email
    const emailHTML = generateComicEmail(comic, users[0]);
    
    // Per ogni utente, invia l'email
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
          to: user.email,
          subject: `Exit Wounds - Chapter ${comic.chapter}: ${comic.title}`,
          html: emailHTML,
          attachments: [
            {
              filename: `exit-wounds-chapter-${comic.chapter}.pdf`,
              path: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${comic.pdfUrl}`
            }
          ]
        });
        successCount++;
      } catch (error) {
        console.error(`Errore nell'invio dell'email a ${user.email}:`, error);
        errorCount++;
      }
    }
    
    // Aggiorno il record del fumetto con le informazioni di invio
    await db.collection('comics').updateOne(
      { _id: new ObjectId(comicId) },
      { 
        $set: { 
          sentAt: new Date(),
          recipients: successCount
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: `Fumetto inviato con successo a ${successCount} utenti. ${errorCount} errori.`,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error('Errore nell\'invio del fumetto:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Funzione per generare l'HTML dell'email
function generateComicEmail(comic: Comic, user: any) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exit Wounds - Chapter ${comic.chapter}</title>
      <style>
        /* Stili globali */
        body, html {
          margin: 0;
          padding: 0;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
        }
        
        /* Container principale */
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 30px 20px;
          background-color: #ffffff;
          border: 2px solid #000;
          border-radius: 15px;
          box-shadow: 5px 5px 0px #000;
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px dashed #000;
          padding-bottom: 20px;
        }
        
        /* Titoli */
        h1 {
          color: #000;
          font-size: 28px;
          margin-bottom: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        
        /* Titolo stile marker */
        .title-marker {
          display: inline-block;
          font-size: 22px;
          font-weight: 800;
          color: #000;
          position: relative;
          padding: 5px 0;
          margin: 25px 0 15px;
        }
        
        .title-marker:after {
          content: "";
          position: absolute;
          left: -2px;
          right: -2px;
          bottom: 2px;
          height: 15px;
          background-color: #FFDD33;
          z-index: -1;
          transform: skew(-3deg);
        }
        
        /* Contenuto */
        p {
          margin-bottom: 15px;
          font-size: 16px;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px dashed #000;
          text-align: center;
          font-size: 14px;
        }
        
        .signature {
          font-style: italic;
          margin-top: 15px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EXIT WOUNDS - CHAPTER ${comic.chapter}</h1>
          <h2>${comic.title}</h2>
        </div>
        
        <p>Ciao ${user.nickname || 'lettore'},</p>
        
        <p>Ecco il nuovo capitolo della tua serie preferita di fallimenti imprenditoriali e traumi da startup!</p>
        
        <div class="title-marker">ABOUT THIS CHAPTER</div>
        
        <p>${comic.description}</p>
        
        <p>Il PDF è allegato a questa email. Aprilo, leggilo e fammi sapere cosa ne pensi rispondendo direttamente a questa email.</p>
        
        <p>Ricorda che puoi anche condividere questo contenuto con altri founder traumatizzati - la miseria ama compagnia.</p>
        
        <div class="footer">
          <div class="signature">
            Still somewhat breathing,<br><br>
            Marco<br>
            Ex-founder, Eternal White Belt & Accidental AI Wrangler
          </div>
          
          <p><small>©2025 Exit Wounds | <a href="#">Unsubscribe</a></small></p>
        </div>
      </div>
    </body>
    </html>
  `;
} 