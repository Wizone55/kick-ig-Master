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
    } catch (e) { console.log("Error enviando a Telegram"); }
}

(async () => {
    // 🛡️ SEGURIDAD: Espera aleatoria (1-30 seg) para no parecer un bot
    const waitTime = Math.floor(Math.random() * 30000);
    console.log(`Esperando ${waitTime/1000}s para seguridad...`);
    await new Promise(r => setTimeout(r, waitTime));

    // 🎯 LISTA DE PRÁCTICA ACTUALIZADA
    const kickChannels = ["mikucatowo", "aventurexa", "reven"]; 
    const igUsers = ["maryblog32", "soyevapartis"];

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // --- REVISANDO KICK ---
    for (const channel of kickChannels) {
        try {
            let m3u8Url = null;
            // Interceptor de red para cazar el link real
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = request.url();
                if (url.includes('.m3u8') && (url.includes('master') || url.includes('playlist'))) {
                    m3u8Url = url;
                }
                request.continue();
            });

            await page.goto(`https://kick.com/${channel}`, { waitUntil: 'networkidle2', timeout: 40000 });
            await new Promise(r => setTimeout(r, 10000)); // 10 seg para que cargue el video

            const isLive = await page.evaluate(() => {
                const badge = document.querySelector('.bg-vibrant');
                return badge && (badge.innerText.includes('LIVE') || badge.innerText.includes('EN VIVO'));
            });

            if (isLive && m3u8Url) {
                const cleanLink = m3u8Url.replace(/\\/g, '');
                await sendTelegram(`🟢 **KICK: ${channel.toUpperCase()} EN VIVO**\n🔗 M3U8: \`${cleanLink}\``);
            }
            
            await page.setRequestInterception(false);
            page.removeAllListeners('request');
        } catch (e) { console.log(`Error Kick ${channel}`); }
    }

    // --- REVISANDO IG STORIES (PICUKI) ---
    for (const user of igUsers) {
        try {
            await page.goto(`https://www.picuki.com/profile/${user}`, { waitUntil: 'networkidle2', timeout: 30000 });
            const hasStories = await page.evaluate(() => {
                return !!document.querySelector('.profile-avatar.has-stories');
            });

            if (hasStories) {
                await sendTelegram(`📸 **IG: @${user}** tiene historias!\n🔗 Ver: https://www.picuki.com/profile/${user}`);
            }
        } catch (e) { console.log(`Error IG ${user}`); }
    }

    await browser.close();
})();
