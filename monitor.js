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
    const kickChannels = ["sofipatatita", "pauchikita", "roxanny"]; 
    
    // Cerramos en 3 minutos para que no se quede amarillo infinito
    const globalTimeout = setTimeout(() => process.exit(0), 180000);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`🔍 Buscando datos de: ${channel}`);
            
            // Vamos a la pestaña de videos (VODs) que es menos protegida
            await page.goto(`https://kick.com/${channel}/videos`, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            await new Promise(r => setTimeout(r, 10000)); 

            const data = await page.evaluate(() => {
                const html = document.documentElement.innerHTML;
                // Buscamos cualquier master.m3u8 presente en la página de videos
                const matches = html.match(/https:\/\/stream\.kick\.com\/[^"']+\/master\.m3u8/gi);
                return matches ? [...new Set(matches)] : null; // Eliminamos duplicados
            });

            if (data && data.length > 0) {
                // Tomamos el primer link (el más reciente)
                const cleanLink = data[0].replace(/\\/g, '');
                await sendTelegram(`🎥 **VOD/LIVE DETECTADO: ${channel.toUpperCase()}**\n\nLink:\n\`${cleanLink}\``);
            } else {
                console.log(`No se encontraron links para ${channel}`);
            }

        } catch (e) { 
            console.log(`⚠️ Error en ${channel}`); 
        }
    }

    await browser.close();
    process.exit(0);
})();
