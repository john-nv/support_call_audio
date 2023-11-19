// const serverApi = 'http://localhost:3333'
// const serverApi = 'https://9bdd-171-232-180-235.ngrok-free.app'
// const serverApi = 'http://38.242.159.108:3333'
// const socket = io(serverApi)
const socket = io()

let getUserMedias = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let room_id
let local_stream = null
let busy = false
let roomIdUserCurrent = undefined
let roomIdUserCurrentCall = undefined // dang trong cuoc tro chuyen
const beforeNameRoom = 'peer'
const STATUS_MES_USER = {
  BUSY: 'Đã tự động từ chối cuộc gọi hoặc người dùng tự rời đi',
  NEW: 'Bạn có cuộc gọi đến',
  DONE: 'Hoàn thành cuộc gọi',
}
let arrCallRingring = []

// ===== COUNT TIME CALL =======
let secondsCountDown = 0
let intervalCountTimeCall
let countTimeCall = '00:00:00'

const ringRingVoice = new Audio('./voice/ringring.mp3');
const startEndCall = new Audio('./voice/start-end-call.wav');
let audio = document.getElementById("remote-audio");

//  thong bao da co 1 user roi cuoc goi
socket.on('leave_room_alert_admin', payload => {
  const { peer_id, room_id } = payload;
  const roomIdLeave = beforeNameRoom + room_id;
  console.log('co 1 user da roi cuoc goi | peer_id => ', peer_id | '?');
  console.log(payload)
  leaveRoom(room_id)
  checkAndOffRingRing()
  checkIsCallOrNot(roomIdLeave, false)
  if(roomIdUserCurrentCall == room_id){
    $('.inbox-m-show-main').html('')

    // tat dem gio cuo goi
    stopTimeCallWithAdmin()
    secondsCountDown = 0

    leaveRoom()
  }
});

function checkAndOffRingRing(room_id){
  if(arrCallRingring.includes(room_id)){
    endCalling()
    arrCallRingring = arrCallRingring.filter(id => id == room_id)
  }
}

// set tai mau sac va status la da nhan cuoc goi
function checkIsCallOrNot(roomIdLeave, call = false){
  const inboxMElement = $('.inbox-m.' + CSS.escape(roomIdLeave));
  if(!call){
    inboxMElement.find('.inbox-m-message span').text(STATUS_MES_USER.BUSY);
    inboxMElement.removeClass('mes-active').addClass('mes-cancel');
  }else{
    inboxMElement.find('.inbox-m-message span').text(STATUS_MES_USER.DONE);
    inboxMElement.removeClass('mes-active').addClass('mes-done');
  }
}

socket.on('create_room_admin', payload => {
  const { peer_id, room_id: _room_id, nameUser, time } = payload;
  arrCallRingring.push(room_id)
  ringRingCall()
  console.log(`newRoom => ${JSON.stringify(payload)}`);
  room_id = _room_id
  // append call new
  $('.inbox-m-check').prepend(`
    <div class="inbox-m mes-active p-2 ${beforeNameRoom + room_id}">
      <div class="inbox-m-image">
        <img
          src="https://vnn-imgs-a1.vgcloud.vn/cdn.24h.com.vn/upload/4-2019/images/2019-11-28/1574931300-18-hot-girl-lao-goc-viet-dep-khong-ty-vet-khoe-than-hinh-van-nguoi-me-c6-1574928072-width593height593.jpg"
          alt=""
        />
      </div>
      <div class="inbox-m-content pl-2 pb-2">
        <div class="inbox-m-info d-flex justify-content-between">
          <div class="inbox-m-name"><span>${nameUser}</span></div>
          <div class="inbox-m-time"><span>${time}</span></div>
        </div>
        <div class="inbox-m-message">
          <span>${STATUS_MES_USER.NEW}</span>
        </div>
      </div>
    </div>`)
});

$(document).on('click', '.inbox-m', function() {
  if(busy==true) return alert('Bạn đang trong cuộc trò chuyện khác')
  let status = 0
  let phone = ''
  let nameUser = $(this).find('.inbox-m-name span').text();
  let messageUser = $(this).find('.inbox-m-message span').text();
  let classList = $(this).attr('class').split(' ');
  if ($(this).hasClass('mes-active')) status = 1;
  if ($(this).hasClass('mes-cancel')) status = 2;
  if ($(this).hasClass('mes-done'))   status = 3;

  let roomIdUserCall = classList.find(className => className.startsWith('peer'));
  roomIdUserCall = roomIdUserCall ? roomIdUserCall.slice(4) : null;
  roomIdUserCurrent = roomIdUserCall
  switch (status) {
    case 1:
      phone = `
              <div class="inbox-m-show-main-content">
                  <h6>${nameUser}</h6>
                  <span>${messageUser}</span>
                  <div id="btn-admin-control-call" class="d-flex justify-content-between">
                      <button class="btn btn-call btn-call-accept" onclick="joinRoom('${roomIdUserCurrent}')"><i class="fa-solid fa-phone"></i></button>
                  </div>
              </div>`
      break;
    case 2:
      phone = `
              <div class="inbox-m-show-main-content">
                  <h6>${nameUser}</h6>
                  <span>${messageUser}</span>
              </div>`
      break;
    case 3:
      phone = `
              <div class="inbox-m-show-main-content">
                  <h6>${nameUser}</h6>
                  <span>${messageUser}</span>
              </div>`
      break;
  }
  $('.inbox-m-show-main').html(phone)
});

function joinRoom(room_id) {
  peer = new Peer()
  peer.on('open', (id) => {
      $('#btn-admin-control-call').html('connecting...')
      console.log("Admin Connected with Id: " + id);
      navigator.getUserMedia({ audio: true }, (stream) => {
          local_stream = stream;
          console.log('Admin local_stream:', local_stream);
          let call = peer.call(room_id, local_stream);
          console.log('Admin call:', call);

          call.on('stream', (stream) => {
            startTimeCall()

            roomIdUserCurrentCall = room_id

            endCalling()
            startEndCall.play()
            console.log('admin da bat may vao phong => ', room_id)
            $('#btn-admin-control-call').html(`<button onclick="leaveRoom('${room_id}')" class="btn btn-call btn-call-close"><i class="fa-solid fa-xmark"></i></button>`)
            busy = true
            console.log('Admin received remote stream:', stream);
            setRemoteAudioStream(stream);
          });

          call.on('error', (err) => {
              console.error('Admin call error:', err);
          });

          call.on('close', () => {
              console.log('Admin call closed');
          });
      }, (err) => {
          console.log('Admin getUserMedia error:', err);
      });
  });

  peer.on('disconnected', () => {
      console.log('Disconnected from the server.');
  });

  peer.on('error', (err) => {
      console.error('Admin Peer error:', err);
      alert('phong nay khong ton lai, vui long tai lai trang')
  });

  peer.on('close', () => {
      console.log('Admin Peer closed');
  });
}

// Hàm để hiển thị âm thanh từ người gọi
function setRemoteAudioStream(stream) {
  audio.srcObject = stream;
  audio.play();
}

// ================================= Disconnect ===========================

function leaveRoom(room_id_call){
  if(room_id_call == roomIdUserCurrentCall){
    const roomIdLeave = beforeNameRoom + roomIdUserCurrentCall
    checkIsCallOrNot(roomIdLeave, true) // check ben admin de thay doi 
    endCalling()
    busy = false
    startEndCall.play()
    $('.inbox-m-show-main').html('')
    
    disconnectPeer()
    roomIdUserCurrentCall = ''
    console.log('roomIdUserCurrentCall ', roomIdUserCurrentCall)
    socket.emit('leave_room_from_admin', {room_id: room_id_call})
    
    // tat dem gio cuo goi
    stopTimeCallWithAdmin()
    secondsCountDown = 0
  }
}

function disconnectPeer(){
  if (local_stream) {
    console.log('stop audioTracks')
    const audioTracks = local_stream.getAudioTracks();
    audioTracks.forEach(track => track.stop());
    roomIdUserCurrentCall = ''

    console.log('disconnect peer')
    peer.destroy();
    busy = false
  }
}

// ================================= voice ===========================

function ringRingCall(){
  if(!busy){
    calling()
  }else{
    endCalling()
  }
}

function calling(){
  console.log('click')
  if (!ringRingVoice.paused) {
      ringRingVoice.pause();
      ringRingVoice.currentTime = 0;
  }
  ringRingVoice.play();
}

ringRingVoice.addEventListener('ended', function() {
  this.currentTime = 0;
  this.play();
});

function endCalling(){
  ringRingVoice.pause();
  ringRingVoice.currentTime = 0;
}


// ========================================== COUNT TIME CALL ==========================================

function startTimeCall() {
  intervalCountTimeCall = setInterval(() => {
      secondsCountDown++;
      updateStatusCountTimeCall();
  }, 1000);
}

function stopTimeCallWithAdmin() {
  clearInterval(intervalCountTimeCall);
  secondsCountDown = 0;
}

function updateStatusCountTimeCall() {
  const hours = Math.floor(secondsCountDown / 3600);
  const minutes = Math.floor((secondsCountDown % 3600) / 60);
  const remainingSeconds = secondsCountDown % 60;
  const formattedTime = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(remainingSeconds)}`;
  
  countTimeCall = formattedTime
  console.log('thoi gian noi chuyen => ',formattedTime)
  $('.inbox-m-show-main-content span').text(formattedTime);
}

function formatTime(value) {
  return value < 10 ? `0${value}` : value;
}
