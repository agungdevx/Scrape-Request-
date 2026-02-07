// /api/send.js - Edge Function
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { name, url, description, captcha } = body;
    
    // 1. Validasi input
    if (!name || !url || !description || !captcha) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Validasi URL
    if (!url.startsWith('https://')) {
      return new Response(JSON.stringify({ error: 'URL must start with https://' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Validasi CAPTCHA dari cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const captchaCookie = cookies.captcha;
    
    if (!captchaCookie) {
      return new Response(JSON.stringify({ error: 'No CAPTCHA session found. Please refresh the page.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      // Decode dari base64
      const decodedData = atob(captchaCookie);
      const [storedCaptcha, expiryStr] = decodedData.split('|');
      const expiry = parseInt(expiryStr);
      
      // Check expiry
      if (Date.now() > expiry) {
        return new Response(JSON.stringify({ error: 'CAPTCHA expired. Please get a new code.' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': 'captcha=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
          }
        });
      }
      
      // Verify CAPTCHA (case-sensitive)
      if (captcha !== storedCaptcha) {
        return new Response(JSON.stringify({ error: 'Invalid CAPTCHA code. Please try again.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid CAPTCHA session' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Kirim ke Telegram
    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_OWNER_ID;
    
    const message = `📋 *New Scrape Request*\n\n👤 *Name:* ${name}\n🔗 *URL:* ${url}\n📝 *Description:* ${description}\n\n🕐 *Submitted:* ${new Date().toLocaleString('en-US')}`;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await telegramResponse.json();
    
    if (result.ok) {
      // Clear CAPTCHA session setelah sukses
      return new Response(JSON.stringify({ success: true, message: 'Request sent successfully' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'captcha=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
        }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to send to Telegram: ' + (result.description || 'Unknown error') }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
  }
  return cookies;
}