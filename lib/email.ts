import { Resend } from 'resend';

const resend = new Resend('re_L8nxLPsh_AFgnAHfpPmnq1mwezan3Dws4');

export async function sendVerificationEmail(email: string) {
  try {
    await resend.emails.send({
      from: 'marco@exit-wounds.com',
      to: email,
      subject: 'YOUR SUBSCRIPTION IS LIKE A STARTUP: MIGHT DIE WITHOUT VALIDATION',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Hey recovering founder,</h1>
          
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
          
          <h2>WHAT YOU'LL GET AFTER CONFIRMING:</h2>
          <ul>
            <li>Politically incorrect comics about post-startup life</li>
            <li>AI-powered advice for microsaas that don't fail (or at least not immediately)</li>
            <li>Chronicles of a 65 kg guy voluntarily getting choked by strangers</li>
            <li>Zero bullshit motivational quotes (promised)</li>
          </ul>
          
          <p>Waiting for your confirmation message!</p>
          
          <p>And remember, as we say in BJJ: "Tap before you nap, but never tap to life."</p>
          
          <p>Until the next chokehold,</p>
          
          <p>Marco<br>
          Ex-founder, Eternal White Belt & AI Whisperer</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    return false;
  }
} 