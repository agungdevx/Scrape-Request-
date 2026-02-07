// /api/captcha.js - Edge Function
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method === 'GET') {
    // Generate CAPTCHA baru
    const captcha = generateCaptcha();
    const expiry = Date.now() + 300000; // 5 menit
    
    // Encode CAPTCHA + expiry untuk cookie (base64)
    const sessionData = `${captcha}|${expiry}`;
    const encodedData = btoa(sessionData); // Base64 encode
    
    const response = new Response(JSON.stringify({ captcha }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `captcha=${encodedData}; Path=/; HttpOnly; SameSite=Strict; Max-Age=300; Secure`
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