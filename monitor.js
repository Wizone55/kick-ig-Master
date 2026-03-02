const puppeteer = require('puppeteer');
const axios = require('axios');

async function sendTelegram(text) {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.log("Error Telegram"); }
}

(async () => {
    // 🛡️ SEGURIDAD: Espera aleatoria para no parecer un bot (1-20 seg)
    const waitTime = Math.floor(Math.random() * 20000);
    console.log(`Esperando ${waitTime/1000}s por seguridad...`);
    await new Promise(r => setTimeout(r, waitTime));

    const kickChannels = ["mikucatowo", "aventurexa", "reven"]; 
    const igUsers = ["maryblog32", "soyevapartis"];

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // Disfraz de iPhone para mayor compatibilidad
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

    // --- SECCIÓN KICK ---
    for (const channel of kickChannels) {
        try {
            console.log(`Revisando Kick: ${channel}`);
            let m3u8Url = null;

            // Interceptamos el tráfico para cazar el link real del video
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = request.url();
                if (url.includes('.m3u8')) {
                    m3u8Url = url;
                }
                request.continue();
            });

            // Esperamos a que la red esté tranquila (significa que el video cargó)
            await page.goto(`https://kick.com/${channel}`, { 
                waitUntil: 'networkidle0', 
                timeout: 35000 
            });

            const isLive = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                return bodyText.includes('LIVE') || bodyText.includes('EN VIVO');
            });

            if (isLive && m3u8Url) {
                const cleanLink = m3u8Url.replace(/\\/g, '');
                await sendTelegram(`🎯 **KICK: ${channel.toUpperCase()}**\n\nLink capturado:\n\`${cleanLink}\``);
            }
            
            await page.setRequestInterception(false);
            page.removeAllListeners('request');
        } catch (e) { 
            console.log(`Salto por tiempo en Kick: ${channel}`); 
            await page.setRequestInterception(false);
        }
    }

    // --- SECCIÓN INSTAGRAM ---
    for (const user of igUsers) {
        try {
            console.log(`Revisando IG: ${user}`);
            await page.goto(`https://www.picuki.com/profile/${user}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 25000 
            });
            
            const hasStories = await page.evaluate(() => {
                return !!document.querySelector('.profile-avatar.has-stories');
            });

            if (hasStories) {
                await sendTelegram(`📸 **IG: @${user}** tiene historias nuevas!\n🔗 Ver: https://www.picuki.com/profile/${user}`);
            }
        } catch (e) { console.log(`Salto IG: ${user}`); }
    }

    await browser.close();
    console.log("Proceso terminado.");
})();
