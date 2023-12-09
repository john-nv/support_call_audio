const express = require('express');
const mongoose = require('mongoose')
const moment = require('moment')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { ExpressPeerServer } = require('peer');
const socketIO = require('socket.io');
var cors = require('cors')

const { corsOptions } = require('./app/config/cors')
const db = require('./app/db/mongo')
const router = require('./router')
const { historySchema } = require('./schemas');
const { sendGroupMessageTelegram, sendCheckAdmin, sendMsgTele } = require('./public/util/telegram.util');
let io = socketIO(server);
require('dotenv').config()
let ADMIN_BUSY = false;
let roomIdUserCurrentCall = ''
let idAdminCurrentCall = ''

app.use(cors(corsOptions))

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const peerServer = ExpressPeerServer(server, { debug: true,});
app.use('/peerjs', peerServer);

router(app)

app.post('/api/user/call', (req, res) => {
  res.json(ADMIN_BUSY)
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
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
    sendGroupMessageTelegram(payload)
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

  // update status admin
  socket.on('updateBusyAdmin', statusBusy => { 
    ADMIN_BUSY = statusBusy
    sendCheckAdmin(ADMIN_BUSY)
  })

  // update room id current call
  // lay id phong hien tai admin nghe may
  socket.on('update_room_current_call', payload => { 
    roomIdUserCurrentCall = payload.roomIdUserCurrentCall
    idAdminCurrentCall = socket.id
  })

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
    console.log(idAdminCurrentCall)
    if(socket.id == idAdminCurrentCall) {
      io.emit('leave_room_admin', { room_id: roomIdUserCurrentCall });
      roomIdUserCurrentCall = ''
      idAdminCurrentCall = ''
      ADMIN_BUSY = false
      sendCheckAdmin(ADMIN_BUSY)
    }
  });
});

function createHistory(payload) {
  const timeCurrent = getTimeCurrent();
  const data = {
    nameUser: payload.nameUser || 'Người dùng tự ý thoát hoặc tải lại trang',
    whoEndCall: payload.whoIsEndCall || 'Người dùng tự ý thoát hoặc tải lại trang',
    idRoom: payload.room_id || 'Người dùng tự ý thoát hoặc tải lại trang',
    timeInCall: payload.countTimeCall || 'Người dùng tự ý thoát hoặc tải lại trang',
    timeCall: timeCurrent,
  };
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

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});