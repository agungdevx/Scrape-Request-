// /api/captcha.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'GET') {
    // Generate CAPTCHA baru
    const captcha = generateCaptcha();
    
    // Set cookie dengan CAPTCHA yang di-hash
    const captchaHash = await hashCaptcha(captcha);
    const expiry = Date.now() + 300000; // 5 menit
    
    const response = new Response(JSON.stringify({ captcha }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `captcha_session=${captchaHash}|${expiry}; Path=/; HttpOnly; SameSite=Strict; Max-Age=300`
      }
    });
    
    return response;
  }
  
  return new Response('Method not allowed', { status: 405 });
}

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashCaptcha(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text + process.env.CAPTCHA_SECRET);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}