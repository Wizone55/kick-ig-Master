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

async function checkChannel(channel) {
    // Usamos una URL de "CORS Proxy" para ocultar que somos GitHub
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = encodeURIComponent(`https://kick.com/api/v1/channels/${channel}`);

    try {
        console.log(`📡 Intentando vía Proxy: ${channel}`);
        const response = await axios.get(`${proxyUrl}${targetUrl}`, { timeout: 15000 });
        
        // AllOrigins devuelve la respuesta dentro de un campo 'contents'
        const data = JSON.parse(response.data.contents);
        
        if (data.livestream && data.livestream.playback_url) {
            const link = data.livestream.playback_url;
            await sendTelegram(`🎯 **¡LO LOGRAMOS! ${channel.toUpperCase()}**\n\nLink:\n\`${link}\``);
        } else {
            console.log(`${channel} está offline.`);
        }
    } catch (e) {
        console.log(`❌ El Proxy también fue bloqueado para ${channel}`);
    }
}

(async () => {
    const channels = ["sofipatatita", "pauchikita", "roxanny"];
    for (const channel of channels) {
        await checkChannel(channel);
        await new Promise(r => setTimeout(r, 3000));
    }
    process.exit(0);
})();
