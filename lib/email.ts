import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = '2ae0ef0c-c5d8-45db-a3cb-6f4032647ec9';

// Helper per aggiungere contatti all'audience
export async function addContactToAudience(email: string, firstName: string) {
  try {
    const result = await resend.contacts.create({
      email,
      firstName,
      audienceId: AUDIENCE_ID,
      unsubscribed: false
    });
    console.log(`Contatto ${email} aggiunto all'audience con successo!`, result);
    return result;
  } catch (error) {
    console.error(`Errore nell'aggiungere ${email} all'audience:`, error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, nickname: string) {
  try {
    // Invia email all'utente
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      to: email,
      replyTo: 'marco.benvenuti@isendu.com',
      subject: 'YOUR SUBSCRIPTION IS LIKE A STARTUP: MIGHT DIE WITHOUT VALIDATION',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica la tua iscrizione a Exit Wounds</title>
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
            
            ul {
              margin: 15px 0;
              padding-left: 20px;
            }
            
            li {
              margin-bottom: 10px;
              padding-left: 5px;
            }
            
            /* Box di evidenziazione */
            .highlight-box {
              background-color: #f2f2f2;
              border: 2px solid #000;
              border-radius: 15px;
              padding: 15px 20px;
              margin: 25px 0;
            }
            
            /* Bottone - stile 3D */
            .action-button {
              display: block;
              width: 80%;
              margin: 30px auto;
              padding: 15px 25px;
              background-color: #FFDD33;
              color: #000;
              text-decoration: none;
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              border: 3px solid #000;
              border-radius: 40px;
              transition: all 0.2s ease;
              box-shadow: 0 6px 0 #000;
              position: relative;
              top: 0;
            }
            
            .action-button:hover {
              top: -3px;
              box-shadow: 0 9px 0 #000;
            }
            
            .action-button:active {
              top: 3px;
              box-shadow: 0 2px 0 #000;
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
            
            /* Responsive */
            @media only screen and (max-width: 480px) {
              .container {
                padding: 20px 15px;
              }
              
              h1 {
                font-size: 24px;
              }
              
              .action-button {
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hey ${nickname},</h1>
            </div>
            
            <p>Thanks for signing up to "Exit Wounds" - the newsletter where a sold-out founder documents his journey talking to imaginary AI bots and getting voluntarily choked to forget his startup trauma.</p>
            
            <p>But wait... you're not officially part of the misfits club yet!</p>
            
            <p>You still need to confirm this email is yours and that you genuinely want to receive my illustrated nonsense every week.</p>
            
            <p>Yes, it's the usual bureaucratic hassle, but with a twist:</p>
            
            <div class="highlight-box">
              <div class="title-marker">TO CONFIRM, REPLY TO THIS EMAIL WITH:</div>
              <p>Your version of "I've failed a startup too" or "I've never failed but love watching others fail"</p>
              
              <p>(If you've done neither, make something up... lying is a founder's first skill anyway)</p>
            </div>
            
            <div class="title-marker">WHY THIS MADNESS?</div>
            <ul>
              <li>Because standard confirmation links are the digital equivalent of corporate PowerPoints: boring and soulless</li>
              <li>Because your email provider will understand you actually want content from a guy who talks about chokeholds and AI bots, rather than sending me straight to SPAM</li>
              <li>Because I want to know right away if you have a sense of humor or if you're one of those "serial entrepreneur" LinkedIn bio people</li>
            </ul>
            
            <p>Waiting for your confirmation message!</p>
            
            <p>And remember, as we say in BJJ: "Tap before you nap, but never tap to life."</p>
            
            <div class="footer">
              <div class="signature">
                Marco<br>
                Ex-founder, Eternal White Belt & AI Whisperer
              </div>
              
              <p><small>©2025 Exit Wounds | <a href="#">Unsubscribe</a></small></p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    // Invia email di notifica all'admin
    await sendAdminNotificationEmail(email, nickname);

    return true;
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    throw new Error(`Errore nell'invio dell'email di verifica: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
}

async function sendAdminNotificationEmail(userEmail: string, nickname: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      to: 'marco.benvenuti91@gmail.com',
      subject: 'New Exit Wounds Subscriber Needs Approval',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Subscriber Alert</title>
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
            
            ul {
              margin: 15px 0;
              padding-left: 20px;
            }
            
            li {
              margin-bottom: 10px;
              padding-left: 5px;
            }
            
            /* Bottone - stile 3D */
            .approve-button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #FFDD33;
              color: #000;
              text-decoration: none;
              text-align: center;
              font-weight: bold;
              border: 3px solid #000;
              border-radius: 40px;
              transition: all 0.2s ease;
              box-shadow: 0 6px 0 #000;
              position: relative;
              top: 0;
            }
            
            .approve-button:hover {
              top: -3px;
              box-shadow: 0 9px 0 #000;
            }
            
            /* Footer */
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #000;
              text-align: center;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Subscriber Alert!</h1>
            </div>
            
            <p>A new potential misfit has joined the waiting list:</p>
            
            <ul>
              <li>Email: ${userEmail}</li>
              <li>Nickname: ${nickname}</li>
            </ul>
            
            <p>Click the button below to approve this subscriber:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://exit-wounds.com/api/auth/approve?email=${encodeURIComponent(userEmail)}" 
                 class="approve-button">
                Approve Subscriber
              </a>
            </div>
            
            <p>Remember: With great power comes great responsibility... and probably more emails to write.</p>
            
            <div class="footer">
              <p>© 2025 Exit Wounds</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di notifica all\'admin:', error);
    throw error;
  }
}

export async function sendApprovalEmail(email: string, nickname: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      to: email,
      subject: 'ACCESS GRANTED: WELCOME TO THE FAILED FOUNDERS CLUB',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Granted: Welcome to the Failed Founders Club</title>
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
            
            ul {
              margin: 15px 0;
              padding-left: 20px;
            }
            
            li {
              margin-bottom: 10px;
              padding-left: 5px;
            }
            
            /* Sezioni */
            .section {
              margin: 25px 0;
              padding: 15px;
              background-color: #f9f9f9;
              border: 2px solid #000;
              border-radius: 15px;
            }
            
            /* Bottone - stile 3D */
            .action-button {
              display: block;
              width: 80%;
              margin: 30px auto;
              padding: 15px 25px;
              background-color: #FFDD33;
              color: #000;
              text-decoration: none;
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              border: 3px solid #000;
              border-radius: 40px;
              transition: all 0.2s ease;
              box-shadow: 0 6px 0 #000;
              position: relative;
              top: 0;
            }
            
            .action-button:hover {
              top: -3px;
              box-shadow: 0 9px 0 #000;
            }
            
            .action-button:active {
              top: 3px;
              box-shadow: 0 2px 0 #000;
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
            
            /* Responsive */
            @media only screen and (max-width: 480px) {
              .container {
                padding: 20px 15px;
              }
              
              h1 {
                font-size: 22px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ACCESS GRANTED: WELCOME TO THE FAILED FOUNDERS CLUB</h1>
            </div>
            
            <p>Well, well, well... you actually did it. You've officially joined the illustrious ranks of "Exit Wounds" subscribers.</p>
            
            <p>I've personally reviewed your application (read: chuckled at your reply) and deemed you worthy of witnessing my ongoing experiments in getting choked by strangers and talking to AI entities that probably judge me behind my back.</p>
            
            <div class="section">
              <div class="title-marker">WHAT HAPPENS NOW?</div>
              
              <p>Every week, you'll receive a fresh installment of my illustrated misadventures navigating:</p>
              
              <ul>
                <li>Post-founder PTSD</li>
                <li>The awkward transition from "visionary startupper" to "corporate manager"</li>
                <li>My attempts to bootstrap microsaas projects using AI I don't fully understand</li>
                <li>Getting repeatedly destroyed on BJJ mats by people half my age</li>
                <li>Applying bizarre Taleb concepts to everyday failures</li>
                <li>Occasional adult-oriented content that explores the more intimate side of startup life (these editions will be clearly marked)</li>
              </ul>
            </div>
            
            <div class="section">
              <div class="title-marker">WHAT MAKES THIS NEWSLETTER DIFFERENT?</div>
              
              <p>Unlike other tech newsletters that promise "valuable insights" and "actionable strategies," this one delivers:</p>
              
              <ul>
                <li>Brutally honest accounts of startup failure</li>
                <li>Politically incorrect observations about tech culture</li>
                <li>Step-by-step tutorials on how NOT to run a company</li>
                <li>Zero platitudes about "failing forward" (unless they're being mocked)</li>
                <li>Illustrations that make the pain more bearable (or at least more shareable)</li>
                <li>No-filter approach to all aspects of founder life – including the parts other newsletters are too prudish to discuss</li>
              </ul>
            </div>
            
            <div class="section">
              <div class="title-marker">A FEW HOUSEKEEPING ITEMS:</div>
              
              <ul>
                <li>Do share this with friends who might enjoy watching my public unraveling</li>
                <li>Don't expect consistency in publishing schedule (I'm still recovering from VC-induced PTSD)</li>
                <li>Feel free to reply to any newsletter – I'm always up for a conversation with fellow survivors</li>
                <li>Adult content will always be labeled so you can choose when and where to open those editions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <p>Your first proper newsletter will be launched on Monday, April 28th.</p>
              
              <p>Remember the BJJ wisdom: Everyone taps eventually. The trick is getting back up.</p>
            </div>
            
            <div class="section">
              <div class="title-marker">CHECK OUT PUBLISHED COMICS NOW</div>
              <p>While you wait for the next issue, you can already access all previously published comics on my website:</p>
              <a href="https://exit-wounds.com/comics" class="action-button">
                ACCESS COMICS ARCHIVE
              </a>
              <p>New comics will be delivered directly to your inbox, but you can always find the complete collection on the website.</p>
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
      `
    });
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di approvazione:', error);
    throw error;
  }
}

export async function sendReactivationEmail(email: string, nickname: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      to: email,
      replyTo: 'marco.benvenuti91@gmail.com',
      subject: 'MISSED ME? LET\'S RESTART OUR TOXIC RELATIONSHIP',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reactivate Your Exit Wounds Subscription</title>
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
            
            /* Bottone - stile 3D */
            .action-button {
              display: block;
              width: 80%;
              margin: 30px auto;
              padding: 15px 25px;
              background-color: #FFDD33;
              color: #000;
              text-decoration: none;
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              border: 3px solid #000;
              border-radius: 40px;
              transition: all 0.2s ease;
              box-shadow: 0 6px 0 #000;
              position: relative;
              top: 0;
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
              <h1>YOU WANT ME BACK, HUH?</h1>
            </div>
            
            <p>Hey ${nickname},</p>
            
            <p>Looks like you missed your weekly dose of startup trauma therapy and BJJ choke metaphors. I knew you'd be back!</p>
            
            <p>After tapping out of my newsletter, you've decided to rejoin the circle of madness. This is the best decision you've made since deciding not to become a founder.</p>
            
            <div class="title-marker">CONFIRM YOU WANT BACK IN</div>
            
            <p>Before I start clogging your inbox with my therapeutic cartoons again, I need you to confirm that this isn't just a fleeting moment of weakness.</p>
            
            <p>Click the button below to verify that you willingly want to expose yourself to my weekly illustrated trauma:</p>
            
            <a href="https://exit-wounds.com/api/auth/reactivate?email=${encodeURIComponent(email)}" class="action-button">
              HOOK ME UP AGAIN
            </a>
            
            <p>If you don't confirm within 7 days, I'll assume you're playing hard to get, and I'll keep waiting for you. Forever.</p>
            
            <p>Remember, my newsletter is like BJJ: sometimes painful, occasionally uncomfortable, but weirdly addictive.</p>
            
            <div class="footer">
              <div class="signature">
                Still somewhat breathing,<br><br>
                Marco<br>
                Ex-founder, Eternal White Belt & Accidental AI Wrangler
              </div>
              
              <div class="unsubscribe">
                <p><small>©2025 Exit Wounds | <a href="https://exit-wounds.com/api/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return true;
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di riattivazione:', error);
    throw new Error(`Errore nell'invio dell'email di riattivazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
}

// Funzione per inviare email di reset password
export async function sendResetPasswordEmail(email: string, nickname: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  try {
    console.log('Sending reset password email to:', email, 'with token:', token);
    
    // Utilizziamo l'istanza resend invece di fetch manuale
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Exit Wounds <hello@exit-wounds.com>',
      to: [email],
      subject: 'Password Reset - Exit Wounds',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request</title>
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
            }
            
            .header img {
              width: 200px;
              height: auto;
              margin: 0 auto 20px;
              display: block;
            }
            
            /* Titoli */
            h1 {
              color: #000;
              font-size: 24px;
              margin-bottom: 20px;
              text-align: center;
              font-weight: 800;
            }
            
            /* Contenuto */
            p {
              margin-bottom: 15px;
              font-size: 16px;
            }
            
            /* Bottone - stile 3D */
            .action-button {
              display: block;
              width: 70%;
              margin: 30px auto;
              padding: 15px 25px;
              background-color: #FFDD33;
              color: #000;
              text-decoration: none;
              text-align: center;
              font-weight: bold;
              font-size: 18px;
              border: 2px solid #000;
              border-radius: 50px;
              box-shadow: 0 4px 0 #000;
              position: relative;
            }
            
            /* Firma */
            .signature {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              font-style: italic;
            }
            
            /* Footer */
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #777;
              text-align: center;
            }
            
            .footer a {
              color: #555;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images/header_comics.png" alt="Exit Wounds">
              <h1>Password Reset Request</h1>
            </div>
            
            <p>Hey ${nickname},</p>
            
            <p>Seems like you've forgotten your password. Classic founder move - too busy thinking about world domination to remember basic credentials.</p>
            
            <p>Don't worry, we've all been there (except those annoying people with perfect memory). Click the link below to reset your password:</p>
            
            <a href="${resetUrl}" class="action-button">Reset Your Password</a>
            
            <p>This link is valid for 1 hour. After that, it expires like those unrealistic founder promises to VCs.</p>
            
            <p>If you didn't request this, please ignore this email. Someone probably typed in the wrong address - like that time you pitched the wrong deck to investors.</p>
            
            <div class="signature">
              <p>Still somewhat breathing,<br><br>
              Marco<br>
              Ex-founder, Eternal White Belt & Accidental AI Wrangler</p>
            </div>
            
            <div class="footer">
              <p>©2025 Exit Wounds | <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}