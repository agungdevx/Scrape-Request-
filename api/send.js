// /api/send.js - Vercel Serverless Function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, url, description, captcha, captchaCode } = req.body;
    
    // 1. Validasi input
    if (!name || !url || !description || !captcha) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 2. Validasi URL harus https://
    if (!url.startsWith('https://')) {
      return res.status(400).json({ error: 'URL must start with https://' });
    }
    
    // 3. Validasi CAPTCHA (case-sensitive)
    if (captcha !== captchaCode) {
      return res.status(400).json({ error: 'Invalid captcha' });
    }
    
    // 4. Kirim ke Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8214656703:AAEkYM32de_hYMBpkT1gCLl6d2_vPxFwqxI';
    const TELEGRAM_OWNER_ID = process.env.TELEGRAM_OWNER_ID || '5498433064';
    
    const message = `
*New Scrape Request*

- *Name:* ${name}
- *URL:* ${url}
- *Description:* ${description}

- *Submitted:* ${new Date().toLocaleString('en-US')}
    `;
    
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_OWNER_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      return res.status(200).json({ success: true, message: 'Request sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send to Telegram' });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}