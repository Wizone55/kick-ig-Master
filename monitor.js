const puppeteer = require('puppeteer');
const axios = require('axios');

async function sendTelegram(text) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId, text: text, parse_mode: 'Markdown'
        });
    } catch (e) { console.log("Error Telegram"); }
}

(async () => {
    const kickChannels = ["pauchikita", "roxanny", "sofipatatita"]; 
    
    // Si en 3 minutos no acaba, cerramos.
    const globalTimeout = setTimeout(() => process.exit(0), 180000);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Bloqueamos imágenes y CSS para ser ultra rápidos y evitar trackers
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
        else req.continue();
    });

    for (const channel of kickChannels) {
        try {
            console.log(`📡 Escaneando: ${channel}`);
            
            // Vamos directamente a la versión de "reproductor" que es más ligera
            await page.goto(`https://kick.com/video/${channel}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 25000 
            });

            await new Promise(r => setTimeout(r, 8000)); 

            const data = await page.evaluate(() => {
                const html = document.documentElement.innerHTML;
                // Buscamos el link maestro que necesitas
                const match = html.match(/https:\/\/stream\.kick\.com\/[^"']+\/master\.m3u8/i);
                // Si el link existe en el código, es porque hay señal de stream
                return match ? match[0] : null;
            });

            if (data) {
                const cleanLink = data.replace(/\\/g, '');
                await sendTelegram(`🎯 **¡CAZADO! ${channel.toUpperCase()}**\n\nLink Maestro:\n\`${cleanLink}\``);
            }

        } catch (e) { 
            console.log(`⚠️ Error en ${channel}`); 
        }
    }

    await browser.close();
    process.exit(0);
})();
