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
    const kickChannels = ["roxanny", "maryblog", "pauchikita", "nanatty", "sachauzumaki", "airita_miau", "sylvee", "diealis", "pieroarenast", "aventurexa", "sideral", "alejus28"];
    const igUsers = ["maryblog32", "mdjimenaa", "sylvee", "soyevapartis", "oiceleste", "lucero.carnero", "na_____c223", "abriguerra", "jessick"];

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log("Revisando Kick...");
    for (const channel of kickChannels) {
        try {
            await page.goto(`https://kick.com/${channel}`, { waitUntil: 'networkidle2', timeout: 25000 });
            const content = await page.content();
            const m3u8Match = content.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            if (m3u8Match) {
                await sendTelegram(`🟢 **KICK: ${channel.toUpperCase()} EN VIVO**\n🔗 M3U8: \`${m3u8Match[0]}\``);
            }
        } catch (e) { console.log(`Error Kick ${channel}`); }
    }

    console.log("Revisando IG Stories...");
    for (const user of igUsers) {
        try {
            await page.goto(`https://imginn.com/${user}/`, { waitUntil: 'networkidle2', timeout: 25000 });
            const hasStories = await page.evaluate(() => {
                return !!document.querySelector('.stories') || document.body.innerText.includes("Stories");
            });
            if (hasStories) {
                await sendTelegram(`📸 **IG: @${user}** tiene historias nuevas!\n🔗 Ver: https://imginn.com/${user}/`);
            }
        } catch (e) { console.log(`Error IG ${user}`); }
    }

    await browser.close();
})();
