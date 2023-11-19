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
const { historySchema } = require('./app/schemas')

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

app.get('/history', async (req, res) => {
  try {
      const data = await historySchema.find().sort({ createdAt: -1 });
      res.json(data);
  } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let connectionRoom = []

io.on('connection', (socket) => {
  // gui du lieu den admin
  socket.on('create_room', async payload => {
    console.log('create_room => ', payload.room_id)
    connectionRoom.push(payload.room_id)
    payload.time = getTimeCurrent()
    io.emit('create_room_admin', payload);
  });

  // user roi phong
  socket.on('leave_room', async payload => {
    console.log('leave_room => ', payload.room_id)
    connectionRoom = connectionRoom.filter(item => item !== payload.room_id);
    payload.time = getTimeCurrent()
    io.emit('leave_room_alert_admin', payload);
    createHistory(payload)
  });

  // admin roi phong truoc
  socket.on('leave_room_from_admin', async payload => {
    console.log('admin_leave_room => ', payload.room_id)
    connectionRoom = connectionRoom.filter(item => item !== payload.room_id);
    payload.time = getTimeCurrent()
    io.emit('leave_room_admin', payload);
  });

  console.log(`SOCKET ID - connect => ${socket.id}`);
  
  socket.on('disconnect', () => {
    checkLeaveRoomCall(socket.id)
    console.log(`SOCKET ID - disconnected => ${socket.id}`);
  });
});
function createHistory(payload) {
  const timeCurrent = getTimeCurrent();
  const data = {
    nameUser: payload.nameUser || 'không xác định',
    whoEndCall: payload.whoIsEndCall || 'không xác định',
    idRoom: payload.room_id || 'không xác định',
    timeInCall: payload.countTimeCall || 'không xác định',
    timeCall: timeCurrent,
  };
  console.log(data)
  historySchema.create(data);
}

function getTimeCurrent(){
  const hcmcTime = moment().utcOffset(7); 
  return hcmcTime.format('HH:mm');
}

function checkLeaveRoomCall(socketId){
  let arrSocketConnection = connectionRoom.filter(item => item.startsWith(socketId));
  if (arrSocketConnection.length > 0) {
    let arrSocketConnectionCall = arrSocketConnection.pop();
    connectionRoom = connectionRoom.filter(item => item !== arrSocketConnectionCall);
    createHistory({ room_id : arrSocketConnectionCall })
    console.log('leave_room (tu dong thoat tag) => ', arrSocketConnectionCall)
    io.emit('leave_room_alert_admin', {room_id: arrSocketConnectionCall});
  }
}

db.connect()
// router(app)

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});