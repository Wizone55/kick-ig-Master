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
    const kickChannels = ["mikucatowo", "aventurexa", "reven"]; 
    const igUsers = ["maryblog32", "soyevapartis"];

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // Disfraz de iPhone para que Kick no nos bloquee tanto
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

    for (const channel of kickChannels) {
        try {
            console.log(`Revisando: ${channel}`);
            // Solo esperamos 20 segundos máximo por página
            await page.goto(`https://kick.com/${channel}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await new Promise(r => setTimeout(r, 5000)); 

            const isLive = await page.evaluate(() => {
                return document.body.innerText.includes('LIVE') || document.body.innerText.includes('EN VIVO');
            });

            if (isLive) {
                const content = await page.content();
                const m3u8Match = content.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
                if (m3u8Match) {
                    await sendTelegram(`🟢 **KICK: ${channel.toUpperCase()}**\n🔗 M3U8: \`${m3u8Match[0].replace(/\\/g, '')}\``);
                }
            }
        } catch (e) { console.log(`Salto por tiempo en ${channel}`); }
    }

    for (const user of igUsers) {
        try {
            await page.goto(`https://www.picuki.com/profile/${user}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
            const hasStories = await page.evaluate(() => {
                return !!document.querySelector('.profile-avatar.has-stories');
            });
            if (hasStories) {
                await sendTelegram(`📸 **IG: @${user}** tiene historias!`);
            }
        } catch (e) { console.log(`Salto IG ${user}`); }
    }

    await browser.close();
    console.log("Terminado con éxito");
})();
