import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Comic } from '@/lib/models/Comic';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Tipi di destinatari supportati
type RecipientType = 'all' | 'specific' | 'audience';

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

// Funzione per generare l'HTML dell'email
function generateComicEmail(comic: Comic, user: any, textBefore?: string, textAfter?: string) {
  // Generiamo l'HTML per tutte le immagini in ordine
  const imagesHTML = comic.images
    .sort((a, b) => a.order - b.order) // Ordiniamo per il campo order
    .map(image => `
      <div class="comic-image">
        <img src="${image.url}" alt="Immagine di ${comic.title}" style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0; padding: 0; border: none;">
      </div>
    `).join('');

  // Stile CSS per le immagini del fumetto
  const comicStyles = `
    /* Fumetto contenitore */
    .comic-container {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    
    /* Immagini fumetto */
    .comic-image {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    
    .comic-image img {
      max-width: 100%;
      width: 100%;
      height: auto;
      display: block;
      margin: 0;
      padding: 0;
      border: none;
    }
  `;

  // Formattiamo il testo prima e dopo con paragrafi HTML
  const formattedTextBefore = textBefore 
    ? textBefore.split('\n').map(p => p ? `<p>${p}</p>` : `<br/>`).join('\n')
    : `<p>Ciao ${user.nickname || 'lettore'},</p>
       <p>Ecco il nuovo fumetto della tua serie preferita di fallimenti imprenditoriali e traumi da startup!</p>`;

  const formattedTextAfter = textAfter
    ? textAfter.split('\n').map(p => p ? `<p>${p}</p>` : `<br/>`).join('\n')
    : `<p>Ti è piaciuto? Fammi sapere cosa ne pensi rispondendo direttamente a questa email.</p>
       <p>Ricorda che puoi anche condividere questo contenuto con altri founder traumatizzati - la miseria ama compagnia.</p>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exit Wounds - ${comic.title}</title>
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
          max-width: 650px;
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
        
        ${comicStyles}
        
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
          <h1>EXIT WOUNDS</h1>
          <h2>${comic.title}</h2>
        </div>
        
        <div class="text-before">
          ${formattedTextBefore}
        </div>
        
        <p>${comic.description}</p>
        
        <div class="comic-container">
          ${imagesHTML}
        </div>
        
        <div class="text-after">
          ${formattedTextAfter}
        </div>
        
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

// Funzione per inviare email tramite audience Resend
async function sendToAudience(audienceId: string, emailSubject: string, emailHTML: string): Promise<{successCount: number, errorCount: number}> {
  try {
    // Invia email all'audience specificata usando Resend
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      subject: emailSubject,
      html: emailHTML,
      tags: [{ name: 'category', value: 'comic' }],
      // @ts-ignore - audience_id è supportato da Resend ma non è ancora nel tipo
      audience_id: audienceId
    });
    
    // Per le audience non abbiamo un conteggio preciso, quindi ritorniamo un valore stimato
    return { 
      successCount: 1, // Rappresenta l'invio all'audience
      errorCount: 0 
    };
  } catch (error) {
    console.error('Errore nell\'invio all\'audience:', error);
    return { 
      successCount: 0,
      errorCount: 1 
    };
  }
}

// POST /api/send-comic - Invia un fumetto via email
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      comicId, 
      emailSubject, 
      textBefore, 
      textAfter, 
      recipientType = 'all',
      selectedUsers = [],
      audienceId = null
    } = await request.json();
    
    if (!comicId) {
      return NextResponse.json({ error: 'ID fumetto richiesto' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Recupero il fumetto
    const comic = await db.collection('comics').findOne({ _id: new ObjectId(comicId) }) as Comic;
    
    if (!comic) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    // Verifichiamo che ci siano immagini
    if (!comic.images || comic.images.length === 0) {
      return NextResponse.json({ error: 'Il fumetto non contiene immagini' }, { status: 400 });
    }

    // Oggetto email personalizzato o default
    const subject = emailSubject || `Exit Wounds - ${comic.title}`;
    
    let successCount = 0;
    let errorCount = 0;

    // Gestione in base al tipo di destinatario
    if (recipientType === 'audience' && audienceId) {
      // Caso 1: Invio a un'audience Resend
      const dummyUser = { nickname: 'lettore' }; // Utente generico per il template
      const emailHTML = generateComicEmail(comic, dummyUser, textBefore, textAfter);
      
      const result = await sendToAudience(audienceId, subject, emailHTML);
      successCount = result.successCount;
      errorCount = result.errorCount;
    } else {
      // Caso 2: Invio a utenti specifici o tutti gli utenti registrati
      let usersQuery: any = { isApproved: true, isVerified: true };
      
      // Se stiamo inviando a utenti specifici, filtriamo per gli ID selezionati
      if (recipientType === 'specific' && selectedUsers.length > 0) {
        // Convertiamo gli ID da string a ObjectId se necessario
        const userIds = selectedUsers.map((id: string) => 
          typeof id === 'string' ? new ObjectId(id) : id
        );
        usersQuery._id = { $in: userIds };
      }
      
      // Recupero gli utenti in base al filtro
      const users = await db.collection('users').find(usersQuery).toArray();
      
      if (users.length === 0) {
        return NextResponse.json({ error: 'Nessun utente trovato per l\'invio' }, { status: 404 });
      }

      // Preparo l'HTML dell'email
      const emailHTML = generateComicEmail(comic, users[0], textBefore, textAfter);
      
      // Per ogni utente, invia l'email
      for (const user of users) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
            to: user.email,
            subject: subject,
            html: emailHTML
          });
          successCount++;
        } catch (error) {
          console.error(`Errore nell'invio dell'email a ${user.email}:`, error);
          errorCount++;
        }
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