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
    // 🎯 LISTA SOLO KICK
    const kickChannels = ["pauchikita", "roxanny", "sofipatatita"]; 
    
    // Temporizador de seguridad: Si en 5 minutos no termina, se cierra solo
    const globalTimeout = setTimeout(() => {
        console.log("Tiempo límite excedido. Cerrando proceso para evitar bloqueo.");
        process.exit(0);
    }, 300000);

    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    // User Agent de PC para cargar el código fuente completo
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    for (const channel of kickChannels) {
        try {
            console.log(`🔍 Escaneando Kick: ${channel}`);
            
            // Navegación rápida
            await page.goto(`https://kick.com/${channel}`, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });

            // 🕒 ESPERA CLAVE: 15 segundos para que el script de Kick genere el link estático
            await new Promise(r => setTimeout(r, 15000)); 

            const finalLink = await page.evaluate(() => {
                const html = document.documentElement.innerHTML;
                // Buscamos el patrón master.m3u8 en el dominio stream.kick.com
                const match = html.match(/https:\/\/stream\.kick\.com\/[^"']+\/master\.m3u8/i);
                return match ? match[0] : null;
            });

            if (finalLink) {
                const cleanLink = finalLink.replace(/\\/g, '');
                await sendTelegram(`🎯 **LINK MAESTRO: ${channel.toUpperCase()}**\n\n\`${cleanLink}\``);
                console.log(`✅ Link capturado para ${channel}`);
            } else {
                console.log(`❌ ${channel} no está en vivo o el link está oculto.`);
            }

        } catch (e) { 
            console.log(`⚠️ Error en ${channel}: Probablemente tardó demasiado.`); 
        }
    }

    clearTimeout(globalTimeout);
    await browser.close();
    console.log("🚀 Revisión de Kick terminada.");
    process.exit(0); 
})();
