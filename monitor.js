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
    // 🎯 Usuarios de prueba
    const kickChannels = ["mikucatowo", "aventurexa", "reven"]; 

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // User agent de Chrome estándar para evitar sospechas
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`Revisando canal: ${channel}`);
            
            // Navegación rápida: solo espera a que cargue el HTML básico
            await page.goto(`https://kick.com/${channel}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 25000 
            });

            // Espera fija de 8 segundos para que el reproductor cargue el link
            await new Promise(r => setTimeout(r, 8000)); 

            const content = await page.content();
            
            // Buscamos el link .m3u8 en el código de la página
            const m3u8Match = content.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            
            // Verificamos si hay señales de que está en vivo
            const isLive = content.includes('LIVE') || content.includes('EN VIVO') || content.includes('watching');

            if (m3u8Match && isLive) {
                const cleanLink = m3u8Match[0].replace(/\\/g, '');
                await sendTelegram(`✅ **¡LOGRADO! KICK: ${channel.toUpperCase()}**\n\nLink:\n\`${cleanLink}\``);
            } else {
                console.log(`${channel} no parece estar en vivo o no se halló link.`);
            }

        } catch (e) { 
            console.log(`Error en ${channel}: Probablemente tardó demasiado.`); 
        }
    }

    await browser.close();
    console.log("Revisión terminada.");
})();
