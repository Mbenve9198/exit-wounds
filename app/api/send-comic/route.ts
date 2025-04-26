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
function generateComicEmail(comic: Comic, user: any, textBefore?: string, textAfter?: string, showTitle = true) {
  // Generiamo l'HTML per tutte le immagini in ordine
  const imagesHTML = comic.images
    .sort((a, b) => a.order - b.order) // Ordiniamo per il campo order
    .map(image => {
      // Verifica se l'immagine ha censure
      const hasCensors = image.censors && image.censors.length > 0;
      
      // Se non ci sono censure, mostra l'immagine normalmente
      if (!hasCensors) {
        return `
          <div class="comic-image">
            <img src="${image.url}" alt="Immagine di ${comic.title}" style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0; padding: 0; border: none;">
          </div>
        `;
      }
      
      // Se ci sono censure, creiamo un link per visualizzare l'immagine sul sito
      // Ottieni un ID univoco per l'immagine
      const imageId = image.cloudinaryId.split('/').pop() || 'image';
      
      return `
        <div class="comic-image">
          <div style="position: relative; width: 100%;">
            <img src="${image.url}" alt="Immagine di ${comic.title}" style="max-width: 100%; width: 100%; height: auto; display: block; margin: 0; padding: 0; border: none;">
            
            <!-- Layer di censura -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
              ${image.censors?.map(censor => `
                <div style="
                  position: absolute;
                  left: ${censor.x}%;
                  top: ${censor.y}%;
                  width: ${censor.width}%;
                  height: ${censor.height}%;
                  font-size: ${Math.min(censor.width, censor.height) * 0.8}vw;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                ">
                  ${censor.emoji}
                </div>
              `).join('')}
            </div>
            
            <!-- Nota per lo sblocco -->
            <div style="
              position: absolute;
              bottom: 10px;
              right: 10px;
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              font-size: 12px;
              text-align: center;
            ">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://exit-wounds.com'}/comics/${comic._id?.toString()}" style="color: white; text-decoration: underline;">
                Sblocca censura
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

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

  // Otteniamo il nickname dell'utente o un fallback
  const userNickname = user?.nickname || 'lettore';

  // Sostituiamo i placeholder nei testi con i valori reali
  const processTemplate = (text: string) => {
    return text.replace(/\{\{nickname\}\}/g, userNickname);
  };

  // Formattiamo il testo prima e dopo con paragrafi HTML
  const defaultTextBefore = `<p>Ciao ${userNickname},</p>
    <p>Ecco il nuovo fumetto della tua serie preferita di fallimenti imprenditoriali e traumi da startup!</p>`;

  const defaultTextAfter = `<p>Ti è piaciuto? Fammi sapere cosa ne pensi rispondendo direttamente a questa email.</p>
    <p>Ricorda che puoi anche condividere questo contenuto con altri founder traumatizzati - la miseria ama compagnia.</p>`;

  // Usiamo i testi forniti dall'utente o i default, e processiamo i placeholder
  const processedTextBefore = textBefore 
    ? processTemplate(textBefore).split('\n').map(p => p ? `<p style="margin-bottom: 8px;">${p}</p>` : `<br/>`).join('\n')
    : defaultTextBefore;

  const processedTextAfter = textAfter
    ? processTemplate(textAfter).split('\n').map(p => p ? `<p style="margin-bottom: 8px;">${p}</p>` : `<br/>`).join('\n')
    : defaultTextAfter;

  // Creiamo il link di unsubscribe
  const unsubscribeLink = user && user.email
    ? `https://exit-wounds.com/api/unsubscribe?email=${encodeURIComponent(user.email)}${user.unsubscribeToken ? `&token=${user.unsubscribeToken}` : ''}`
    : 'https://exit-wounds.com/api/unsubscribe';

  // URL base per le immagini (da sostituire con l'URL del tuo sito)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://exit-wounds.com';

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
          margin-bottom: 15px;
          padding-bottom: 10px;
        }
        
        .header img {
          max-width: 100%;
          height: auto;
          margin-bottom: 8px;
        }
        
        /* Titoli */
        h2 {
          color: #000;
          font-size: 24px;
          margin-bottom: 10px;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-align: center;
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
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        ${comicStyles}
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 14px;
        }
        
        .signature {
          font-style: italic;
          margin-top: 15px;
          font-weight: 600;
        }
        
        /* Unsubscribe link */
        .unsubscribe {
          margin-top: 15px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        
        .unsubscribe a {
          color: #555;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/images/header_comics.png" alt="Exit Wounds" />
          ${showTitle ? `<h2>${comic.title}</h2>` : ''}
        </div>
        
        <div class="text-before">
          ${processedTextBefore}
        </div>
        
        <div class="comic-container">
          ${imagesHTML}
        </div>
        
        <div class="text-after">
          ${processedTextAfter}
        </div>
        
        <div class="footer">
          <div class="signature">
            Still somewhat breathing,<br><br>
            Marco<br>
            Ex-founder, Eternal White Belt & Accidental AI Wrangler
          </div>
          
          <div class="unsubscribe">
            <p><small>©2025 Exit Wounds | <a href="${unsubscribeLink}">Unsubscribe</a></small></p>
          </div>
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
      replyTo: 'marco.benvenuti91@gmail.com',
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
      showTitle = true,
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
      const emailHTML = generateComicEmail(comic, dummyUser, textBefore, textAfter, showTitle);
      
      const result = await sendToAudience(audienceId, subject, emailHTML);
      successCount = result.successCount;
      errorCount = result.errorCount;
    } else {
      // Caso 2: Invio a utenti specifici o tutti gli utenti registrati
      let usersQuery: any = { isApproved: true, isVerified: true, unsubscribed: { $ne: true } };
      
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

      // Per ogni utente, invia l'email
      for (const user of users) {
        try {
          // Genera un token di unsubscribe se non esiste già
          if (!user.unsubscribeToken) {
            try {
              const UserService = require('@/lib/services/UserService').UserService;
              const token = await UserService.generateUnsubscribeToken(user.email);
              user.unsubscribeToken = token;
            } catch (tokenError) {
              console.error(`Errore nella generazione del token di unsubscribe per ${user.email}:`, tokenError);
            }
          }
          
          // Preparo l'HTML dell'email personalizzato per l'utente
          const emailHTML = generateComicEmail(comic, user, textBefore, textAfter, showTitle);
          
          // Invio l'email
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
            to: user.email,
            replyTo: 'marco.benvenuti91@gmail.com',
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