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
    
    // Cerramos todo en 4 minutos máximo para que no se trabe
    const globalTimeout = setTimeout(() => process.exit(0), 240000);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'] 
    });
    
    const page = await browser.newPage();
    // Usamos un User Agent de una persona real en Windows 11
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`📡 Intentando cazar a: ${channel}`);
            
            // Usamos 'networkidle0' para que espere a que TODO cargue, pero con un tiempo límite menor
            await page.goto(`https://kick.com/${channel}`, { waitUntil: 'networkidle0', timeout: 45000 });

            // Espera de 10 segundos extra para el renderizado del script
            await new Promise(r => setTimeout(r, 10000)); 

            const data = await page.evaluate(() => {
                const body = document.body.innerText;
                const html = document.documentElement.innerHTML;
                
                // Buscamos el link estático que tú usas
                const streamLink = html.match(/https:\/\/stream\.kick\.com\/[^"']+\/master\.m3u8/i);
                
                // Verificamos si realmente dice que está en vivo para no enviarte links viejos
                const liveSignal = body.includes('LIVE') || body.includes('EN VIVO') || html.includes('vjs-live');
                
                return { link: streamLink ? streamLink[0] : null, isLive: liveSignal };
            });

            if (data.link && data.isLive) {
                const cleanLink = data.link.replace(/\\/g, '');
                await sendTelegram(`🎯 **¡EN VIVO! ${channel.toUpperCase()}**\n\nLink Maestro:\n\`${cleanLink}\``);
            } else {
                console.log(`${channel} está offline o protegido.`);
            }

        } catch (e) { 
            console.log(`⚠️ Salto en ${channel} (Timeout)`); 
        }
    }

    await browser.close();
    process.exit(0);
})();
