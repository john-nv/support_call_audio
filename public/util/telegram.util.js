const TelegramBot = require('node-telegram-bot-api');

function sendGroupMessageTelegram(payload) {
    const message = formatContent(payload)
  console.log(process.env.TOKEN_BOT_TELEGRAM, process.env.ID_GROUP_TELEGRAM);

  const bot = new TelegramBot(process.env.TOKEN_BOT_TELEGRAM, { polling: true });
  const groupId = process.env.ID_GROUP_TELEGRAM;

  bot.sendMessage(groupId, message, { parse_mode: 'Markdown' })
    .then(sentMessage => {
      console.log(`Message sent to group ${groupId}: ${sentMessage.text}`);
    })
    .catch(error => {
      console.error(`Error sending message: ${error.message}`);
    });
}

function formatContent(payload) {
    if (!payload.room_id) payload.room_id = 'Có người can thiệp ở Client'
    if (!payload.peer_id) payload.peer_id = 'Có người can thiệp ở Client'
    if (!payload.nameUser) payload.nameUser = 'Có người can thiệp ở Client'

    return `
    *📞 Có cuộc gọi mới 📞*
    -------------------------
    *Mã phòng : * \`${payload.room_id}\`
    *Mã người dùng : * \`${payload.peer_id}\`
    *Tên người gọi : * \`${payload.nameUser}\`
    `;
}


module.exports = { sendGroupMessageTelegram };
