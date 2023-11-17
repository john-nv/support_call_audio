const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { ExpressPeerServer } = require('peer');
const socketIO = require('socket.io');
const io = socketIO(server);
const mongoose = require('mongoose')
const moment = require('moment')
const db = require('./db/mongo')
const router = require('./router')
const { roomSchema } = require('./app/schemas')

let ADMIN_BUSY = false;

app.use(express.static('public'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
const peerServer = ExpressPeerServer(server, { debug: true,});

app.use('/peerjs', peerServer);

app.post('/api/user/call', (req, res) => {
  res.json(ADMIN_BUSY)
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});



io.on('connection', (socket) => {

  // gui du lieu den admin
  socket.on('create_room', async payload => {
    payload.time = getTimeCurrent()
    io.emit('create_room_admin', payload);
  });

  // user roi phong
  socket.on('leave_room', async payload => {
    console.log('leave_room')
    payload.time = getTimeCurrent()
    io.emit('leave_room_admin', payload);
  });


  console.log(`SOCKET ID - connect => ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`SOCKET ID - disconnected => ${socket.id}`);
    io.emit('leave_room_admin', {room_id: `${socket.id}MEET`});
});
  
  // // nhan tin nhan user
  // socket.on('message-user', payload => {
  //   const { room_chat_id, message, to } = payload;
  //   const veryRoom = validateRoom(room_chat_id)
  //   if(veryRoom < 1)  return
  //   io.emit('message-admin', message);
  // });


//   // nhan tin nhan admin
//   socket.on('message-admin', payload => {
//     const { room_chat_id, message } = payload;
//     const veryRoom = validateRoom(room_chat_id)
//     if(veryRoom < 1) return
//     io.emit('message-user', message);
//   });

//   function validateRoom(room_chat_id) {
//     return roomSchema.countDocuments({idRoom: room_chat_id});
//   }

//   // function saveMessage(room_chat_id) {
//   //   return roomSchema.countDocuments({idRoom: room_chat_id});
//   // }
});









function getTimeCurrent(){
  const hcmcTime = moment().utcOffset(7); 
  return hcmcTime.format('HH:mm');
}




db.connect()
// router(app)

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});