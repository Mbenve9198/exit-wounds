import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not defined');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, nickname: string) {
  try {
    // Invia email all'utente
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'marco@exit-wounds.com',
      to: email,
      replyTo: 'marco.benvenuti@isendu.com',
      subject: 'YOUR SUBSCRIPTION IS LIKE A STARTUP: MIGHT DIE WITHOUT VALIDATION',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Hey ${nickname},</h1>
          
          <p>Thanks for signing up to "Exit Wounds" - the newsletter where a sold-out founder documents his journey talking to imaginary AI bots and getting voluntarily choked to forget his startup trauma.</p>
          
          <p>But wait... you're not officially part of the misfits club yet!</p>
          
          <p>You still need to confirm this email is yours and that you genuinely want to receive my illustrated nonsense every week.</p>
          
          <p>Yes, it's the usual bureaucratic hassle, but with a twist:</p>
          
          <h2>TO CONFIRM, REPLY TO THIS EMAIL WITH:</h2>
          <p>Your version of "I've failed a startup too" or "I've never failed but love watching others fail"</p>
          
          <p>(If you've done neither, make something up... lying is a founder's first skill anyway)</p>
          
          <h2>WHY THIS MADNESS?</h2>
          <ul>
            <li>Because standard confirmation links are the digital equivalent of corporate PowerPoints: boring and soulless</li>
            <li>Because your email provider will understand you actually want content from a guy who talks about chokeholds and AI bots, rather than sending me straight to SPAM</li>
            <li>Because I want to know right away if you have a sense of humor or if you're one of those "serial entrepreneur" LinkedIn bio people</li>
          </ul>
          
          <p>Waiting for your confirmation message!</p>
          
          <p>And remember, as we say in BJJ: "Tap before you nap, but never tap to life."</p>
          
          <p>Marco<br>
          Ex-founder, Eternal White Belt & AI Whisperer</p>
        </div>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Subscriber Alert!</h1>
          
          <p>A new potential misfit has joined the waiting list:</p>
          
          <ul>
            <li>Email: ${userEmail}</li>
            <li>Nickname: ${nickname}</li>
          </ul>
          
          <p>Click the button below to approve this subscriber:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/auth/approve?email=${encodeURIComponent(userEmail)}" 
               style="display: inline-block; padding: 12px 24px; background-color: #FFDD33; color: black; text-decoration: none; border: 2px solid black; border-radius: 50px; font-weight: bold;">
              Approve Subscriber
            </a>
          </div>
          
          <p>Remember: With great power comes great responsibility... and probably more emails to write.</p>
        </div>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>ACCESS GRANTED: WELCOME TO THE FAILED FOUNDERS CLUB</h1>
          
          <p>Well, well, well... you actually did it. You've officially joined the illustrious ranks of "Exit Wounds" subscribers.</p>
          
          <p>I've personally reviewed your application (read: chuckled at your reply) and deemed you worthy of witnessing my ongoing experiments in getting choked by strangers and talking to AI entities that probably judge me behind my back.</p>
          
          <h2>WHAT HAPPENS NOW?</h2>
          
          <p>Every week, you'll receive a fresh installment of my illustrated misadventures navigating:</p>
          
          <ul>
            <li>Post-founder PTSD</li>
            <li>The awkward transition from "visionary leader" to "corporate slave"</li>
            <li>My attempts to bootstrap microsaas projects using AI I don't fully understand</li>
            <li>Getting repeatedly destroyed on BJJ mats by people half my age</li>
            <li>Applying bizarre Taleb concepts to everyday failures</li>
            <li>Occasional adult-oriented content that explores the more intimate side of startup life (these editions will be clearly marked)</li>
          </ul>
          
          <h2>WHAT MAKES THIS NEWSLETTER DIFFERENT?</h2>
          
          <p>Unlike other tech newsletters that promise "valuable insights" and "actionable strategies," this one delivers:</p>
          
          <ul>
            <li>Brutally honest accounts of startup failure</li>
            <li>Politically incorrect observations about tech culture</li>
            <li>Step-by-step tutorials on how NOT to run a company</li>
            <li>Zero platitudes about "failing forward" (unless they're being mocked)</li>
            <li>Illustrations that make the pain more bearable (or at least more shareable)</li>
            <li>No-filter approach to all aspects of founder life – including the parts other newsletters are too prudish to discuss</li>
          </ul>
          
          <h2>A FEW HOUSEKEEPING ITEMS:</h2>
          
          <ul>
            <li>Do share this with friends who might enjoy watching my public unraveling</li>
            <li>Don't expect consistency in publishing schedule (I'm still recovering from VC-induced PTSD)</li>
            <li>Feel free to reply to any newsletter – I'm always up for a conversation with fellow survivors</li>
            <li>Adult content will always be labeled so you can choose when and where to open those editions</li>
          </ul>
          
          <p>Your first proper newsletter will arrive tomorrow.</p>
          
          <p>Remember the BJJ wisdom: Everyone taps eventually. The trick is getting back up.</p>
          
          <p>Still somewhat breathing,</p>
          
          <p>Marco<br>
          Ex-founder, Eternal White Belt & Accidental AI Wrangler</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Errore nell\'invio dell\'email di approvazione:', error);
    throw error;
  }
} 