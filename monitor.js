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
    // 📋 NUEVA LISTA DE STREAMERS
    const kickChannels = ["maryblog", "diealis", "sideral"]; 

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // Disfraz de Chrome PC para que Kick suelte el código fuente completo
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`🔍 Buscando link estático de: ${channel}`);
            
            // Navegación con paciencia (40 segundos de límite)
            await page.goto(`https://kick.com/${channel}`, { 
                waitUntil: 'networkidle2', 
                timeout: 40000 
            });
            
            // 🕒 ESPERA MAESTRA: 15 segundos para que los metadatos carguen en el HTML
            await new Promise(r => setTimeout(r, 15000)); 

            const finalLink = await page.evaluate(() => {
                const html = document.documentElement.innerHTML;
                // Buscamos el patrón exacto que tú usas: stream.kick.com ... master.m3u8
                // Buscamos en todo el código fuente de la página
                const match = html.match(/https:\/\/stream\.kick\.com\/[^"']+\/master\.m3u8/i);
                return match ? match[0] : null;
            });

            if (finalLink) {
                // Limpiamos barras invertidas si el link viene de un JSON interno
                const cleanLink = finalLink.replace(/\\/g, '');
                await sendTelegram(`🎯 **LINK MAESTRO: ${channel.toUpperCase()}**\n\n\`${cleanLink}\``);
                console.log(`✅ Link encontrado para ${channel}`);
            } else {
                console.log(`❌ No se halló link estático en ${channel} (¿Está offline?)`);
            }
        } catch (e) { 
            console.log(`⚠️ Error en el canal ${channel}: ${e.message}`); 
        }
    }

    await browser.close();
    console.log("🚀 Escaneo finalizado.");
})();
