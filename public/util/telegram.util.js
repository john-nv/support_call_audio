const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TOKEN_BOT_TELEGRAM, { polling: true });
const groupId = process.env.ID_GROUP_TELEGRAM;

function sendGroupMessageTelegram(payload) {
  const message = formatContent(payload);

  console.log(message);
  
  bot.sendMessage(groupId, message, { parse_mode: 'Markdown' })
    .then(msg => {
      console.log(`send message telegram`);
    })
    .catch(error => {
      bot.sendMessage(groupId, `❌ Lỗi khi gửi bot telegram =>
      ${error.message}`, { parse_mode: 'Markdown' });
      console.error(`Error sending message: ${error.message}`);
    });
}

function sendCheckAdmin(boolean) {
  let message = '?'
  if(boolean) {
    message = 'ADMIN đang bận'
  }else {
    message = 'ADMIN đã rảnh tay'
  }
  
  bot.sendMessage(groupId, message, { parse_mode: 'Markdown' })
    .then(msg => { console.log(`send message telegram`) })
    .catch(error => {
      bot.sendMessage(groupId, `❌ Lỗi khi gửi bot telegram =>
      ${error.message}`, { parse_mode: 'Markdown' });
      console.error(`Error sending message: ${error.message}`);
    });
}

function formatContent(payload) {
  if (!payload.room_id) payload.room_id = 'warning_client';
  if (!payload.peer_id) payload.peer_id = 'warning_client';
  if (!payload.nameUser) payload.nameUser = 'warning_client';

  return `
📢 Có cuộc gọi mới

🧑 | \`${payload.nameUser}\`
📞 | \`${payload.room_id}\`
⏰ | \`${payload.time}\`


`;
}

//🔗 [Bấm vào đây để nghe](${process.env.DOMAIN}?roomId=${payload.room_id}&nameUser=${payload.nameUser}&time=${payload.time})

module.exports = { sendGroupMessageTelegram, sendCheckAdmin };
