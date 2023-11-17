const socket = io('http://localhost:3333');
let room_chat_id = undefined
const timeUNIX = Date.now()

socket.on('reply-chat', (msg) => {
  console.log(`Received message: ${msg}`);
});


socket.on('message-user', payload => {
  console.log(`=> : ${payload}`);
});

$('#joinRoom-mes').on('click', () => {
  const payload = {
    room_chat_id: `${socket.id},${timeUNIX}`,
    nameUser: $('#username').val()
  }
  socket.emit('joinRoom', payload);
})

$('#send-mes').on('click', () => {
  let payload = {
    message: $('#value-mes').val(),
    room_chat_id: room_chat_id,
    to: 0
  }
  socket.emit('message-user', payload);
})
