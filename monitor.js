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
    try {
        console.log(`📡 Consultando: ${channel}`);
        // Simulamos una petición de una App de Android/iPhone
        const response = await axios.get(`https://kick.com/api/v1/channels/${channel}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        const data = response.data;
        
        // Si está en vivo, Kick suele devolver el objeto 'playback_url'
        if (data.livestream && data.livestream.playback_url) {
            const link = data.livestream.playback_url;
            await sendTelegram(`🎯 **¡EN VIVO! ${channel.toUpperCase()}**\n\nLink:\n\`${link}\``);
        } else {
            console.log(`${channel} está offline.`);
        }
    } catch (e) {
        console.log(`❌ Error en ${channel}: Probablemente bloqueo de IP.`);
    }
}

(async () => {
    const channels = ["sofipatatita", "pauchikita", "roxanny"];
    for (const channel of channels) {
        await checkChannel(channel);
        // Pequeña espera entre canales para no ser detectados
        await new Promise(r => setTimeout(r, 2000));
    }
    process.exit(0);
})();
