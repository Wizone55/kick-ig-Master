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
    const kickChannels = ["mikucatowo", "aventurexa", "reven"]; 

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // Nuevo disfraz de Chrome PC actualizado
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`🔍 Escaneando a fondo: ${channel}`);
            
            // Navegación con tiempo de espera generoso
            await page.goto(`https://kick.com/${channel}`, { 
                waitUntil: 'networkidle2', 
                timeout: 40000 
            });

            // 🕒 ESPERA CRUCIAL: 15 segundos para que el video conecte
            await new Promise(r => setTimeout(r, 15000)); 

            const content = await page.content();
            
            // Buscamos el link m3u8 con una expresión regular más amplia
            const m3u8Match = content.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i);
            
            // Verificamos si hay rastros de transmisión en vivo en el código
            const isLive = content.includes('LIVE') || 
                           content.includes('EN VIVO') || 
                           content.includes('vjs-live') || // Clase del reproductor de video
                           content.includes('watching');

            if (m3u8Match && isLive) {
                const cleanLink = m3u8Match[0].split('"')[0].split("'")[0].replace(/\\/g, '');
                await sendTelegram(`🔥 **¡CAZADO! ${channel.toUpperCase()} ESTÁ EN VIVO**\n\nLink del flujo:\n\`${cleanLink}\``);
                console.log(`✅ Éxito con ${channel}`);
            } else {
                console.log(`❌ ${channel} no detectado como vivo.`);
            }

        } catch (e) { 
            console.log(`⚠️ Error o Timeout en ${channel}`); 
        }
    }

    await browser.close();
    console.log("🚀 Fin del escaneo.");
})();
