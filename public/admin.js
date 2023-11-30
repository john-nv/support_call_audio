const socket = io()

let getUserMediaCustom = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
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

async function joinRoom(room_id) {
  peer = await new Peer({host: '/', port: 9000,});
  console.log('peer => ', peer)
  peer.on('open', (id) => {
      $('#btn-admin-control-call').html('connecting...')
      console.log("Admin Connected with Id: " + id);
      // navigator.getUserMedia({ audio: true }, (stream) => {
      getUserMediaCustom({ audio: true }, (stream) => {
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
      $('#dialog_alert_admin_content').html('Người dùng đã thoát')
      $('#dialog_alert_admin').modal('show')
      $('.inbox-m-show-main').html('')
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

// ================================= LOGIN =======================

const _ = localStorage.getItem('_')
if (!_ || _.length < 1) {
  $('#dialog_login').modal('show')
}else{
  $.ajax({
  type: "POST",
  url: "/admin/verify",
  data: {token: _ },
  success: function(res) {
    if(res.code == 1) return;
    localStorage.setItem('_', '')
    $('#dialog_login').modal('show')
  },
  error: function(error) {
    localStorage.setItem('_', '')
    alert('Vui lòng tải lại trang')
    console.error("Error:", error);
  }
});
}

$('#btn-login').on('click', () => {
  const user = $('#l-username').val()
  const pass = $('#l-password').val()
  validateLogin(user, pass)
  $.ajax({
    type: "POST",
    url: "/admin/login",
    data: {user, pass},
    success: function(res) {
      if(res.code != 1) return alert(res.message);

      localStorage.setItem('_', res.jwt)
      $('#dialog_login').modal('hide');
    },
    error: function(error) {
      alert('Lỗi chương trình')
      console.error("Error:", error);
    }
  });
})


function validateLogin(user, pass){
  if(user.length < 1 || pass.length < 1) alert('Mật khẩu hoặc mật khẩu không được trống')
}

// ============================= CONTROL ========================

$(document).on('click', '#btn-exit-table-control', function() {
  $('#control-admin-main').css('height', 'auto');
  $('#control-admin-main').html('<h4 style="text-align: center; color: white;">Bảng điều kiển Admin</h4>')
})

$('#btn-edit-platforms-user').on('click', () => {
  $.ajax({
    type: "POST",
    url: "/admin/getConfig",
    success: function(res) {
      if(res.code != 1) {
        
        $('#dialog_alert_admin_content').html(error.responseJSON.message)
        $('#dialog_alert_admin').modal('show')
        return 
      };
      const data = res.data
      $('#control-admin-main').html(`
      <h4 style="text-align: center; color: white;">Chỉnh sửa chi tiết người dùng</h4><hr>
      <hr>
      <div class="form-row">
        <div class="col-md-4 mb-3">
          <label style="color: #5a5a5a;" for="validationTimeCall">Thời gian chờ nghe máy (tính theo giây)</label>
          <input type="text" class="form-control" id="validationTimeCall" value="${data.timeAwaitUser}" placeholder="Thời gian chờ nghe máy (tính theo giây)">
        </div>
        <div class="col-md-4 mb-3">
          <label style="color: #5a5a5a;" for="validationTitle">Tiêu đề chào mừng nhập tên</label>
          <input type="text" class="form-control" id="validationTitle" value="${data.titleUser}" placeholder="Tiêu đề chào mừng nhập tên">
        </div>
        <div class="col-md-4 mb-3">
                <label style="color: #5a5a5a;" for="validationTitleHome">Tiêu đề </label>
          <input type="text" class="form-control" id="validationTitleHome" value="${data.titleHome}" placeholder="Tiêu đề ">
        </div>
      </div>
      <label style="color: #5a5a5a;" for="validationStatusStart">Trang thái bắt đầu gọi</label>
      <input type="text" class="form-control mb-3" id="validationStatusStart" value="${data.msgStart}" placeholder="Trang thái bắt đầu gọi">
      <label style="color: #5a5a5a;" for="validationStatusBusy">Trang thái hỗ trợ viên bận hoặc không nhắc máy</label>
      <input type="text" class="form-control mb-3" id="validationStatusBusy" value="${data.msgBusy}" placeholder="Trang thái hỗ trợ viên bận hoặc không nhắc máy">
      <label style="color: #5a5a5a;" for="validationStatusDone">Trang thái người dùng đã hoàn thành xong cuộc gọi</label>
      <input type="text" class="form-control mb-3" id="validationStatusDone" value="${data.msgDone}" placeholder="Trang thái người dùng đã hoàn thành xong cuộc gọi">
      <label style="color: #5a5a5a;" for="validationStatusConnect">Trang thái người dùng đang kết nối</label>
      <input type="text" class="form-control mb-3" id="validationStatusConnect" value="${data.msgConnect}" placeholder="Trang thái người dùng đang kết nối">
      <div class="d-flex justify-content-between mt-4">
        <div></div>
        <div>
          <button class="btn btn-secondary btn-admin-custom" id="btn-exit-table-control">Thoát</button>
          <button class="btn btn-success btn-admin-custom" id="btn-edit-platforms-user-save">Lưu thay đổi</button>
        </div>
      </div>`)
    },
    error: function(error) {
      $('#dialog_alert_admin_content').html(error.responseJSON.message)
      $('#dialog_alert_admin').modal('show')
      console.error("Error:", error);
    }
  });
})

$(document).on('click', '#btn-clear-all-history', function() {
  const token = localStorage.getItem('_')
  $.ajax({
    type: "POST",
    url: "/admin/deleteAllHistoryCall",
    data: {token},
    success: function(res) {
      if(res.code != 1) return
      $('#btn-exit-table-control').click()
      $('#dialog_alert_admin_content').html(res.message)
      $('#dialog_alert_admin').modal('show')
    },
    error: function(error) {
      $('#dialog_alert_admin_content').html(error.responseJSON.message)
      $('#dialog_alert_admin').modal('show')
      console.error("Error:", error);
    }
  });
})

$(document).on('click', '#btn-get-history', function() {
  $('#control-admin-main').css('height', '600px');
  const token = localStorage.getItem('_')
    $.ajax({
      type: "POST",
      url: "/admin/getHistoryCall",
      data: {token},
      success: function(res) {
        if(res.code != 1) {
          $('#dialog_alert_admin_content').html(res.message)
          $('#dialog_alert_admin').modal('show')
          return
        };
        const data = res.items
        $('#control-admin-main').html('')
        $('#control-admin-main').append('<h4 style="text-align: center; color: white;">Lịch sử cuộc gọi</h4><hr>')
        $('#control-admin-main').append(`<div class="d-flex justify-content-between mt-4">
                                          <div>
                                            <button class="btn btn-danger btn-admin-custom" id="btn-clear-all-history">Xóa toàn bộ lịch sử</button>
                                          </div>
                                          <div>
                                            <button class="btn btn-secondary btn-admin-custom" id="btn-exit-table-control">Thoát</button>
                                          </div>
                                        </div><hr>`)
        for (let i = 0; i < data.length; i++) {
          const classColor = data[i].timeInCall == '00:00:00' ? 'history-call-item-busy' : 'history-call-item-accept'
          const timeRight = moment(data[i].createdAt).format('HH:mm:ss DD/MM/YYYY');

          const item = `<div class="history-call-item mb-2 ${classColor}">
                          <span class="history-call-name">Tên người gọi : </span>
                          <span class="font-weight-bold">${data[i].nameUser}</span><br>
                          <span class="history-call-end-call">Người kêt thúc cuộc gọi trước : </span>
                          <span class="font-weight-bold">${data[i].whoEndCall}</span><br>
                          <span class="history-call-time-call">Thời gian trong cuộc gọi : </span>
                          <span class="font-weight-bold">${data[i].timeInCall}</span><br>
                          <span class="history-call-time-created">Thời gian gọi : </span>
                          <span class="font-weight-bold">${data[i].timeCall} ( ${timeRight} )</span><br>
                          <span class="history-call-id-call">ID cuộc gọi : </span>
                          <span class="font-weight-bold">${data[i]._id}</span><br>
                          <span class="history-call-id-room">ID phòng gọi : </span>
                          <span class="font-weight-bold">${data[i].idRoom}</span><br>
                        </div>`
          $('#control-admin-main').append(item)
        }
        
        
        $('#dialog_alert_admin_content').html(`Kho lưu trữ đang lưu trữ ${res.total} cuộc gọi`)
        $('#dialog_alert_admin').modal('show')
        
      },
      error: function(error) {
        $('#dialog_alert_admin_content').html(error.responseJSON.message)
        $('#dialog_alert_admin').modal('show')
        console.error("Error:", error);
      }
    });
})

$(document).on('click', '#btn-edit-platforms-user-save', function() {
  const validationTimeCall = Number($('#validationTimeCall').val())
  const validationTitle = $('#validationTitle').val()
  const validationTitleHome = $('#validationTitleHome').val()
  const validationStatusStart = $('#validationStatusStart').val()
  const validationStatusBusy = $('#validationStatusBusy').val()
  const validationStatusDone = $('#validationStatusDone').val()
  const validationStatusConnect = $('#validationStatusConnect').val()
  const isCheckValidate = validateEditPlatforms(validationTimeCall, validationTitle, validationTitleHome, 
    validationStatusStart, validationStatusBusy, validationStatusDone, validationStatusConnect) 
  if(isCheckValidate.isValid){
    const token = localStorage.getItem('_')
    $.ajax({
      type: "POST",
      url: "/admin/config",
      data: {
          token, 
          timeAwaitUser: validationTimeCall, 
          titleUser: validationTitle, 
          titleHome: validationTitleHome, 
          msgStart: validationStatusStart, 
          msgBusy: validationStatusBusy, 
          msgDone: validationStatusDone, 
          msgConnect: validationStatusConnect
        },
      success: function(res) {
        if(res.code != 1) {
          $('#dialog_alert_admin_content').html(res.message)
          $('#dialog_alert_admin').modal('show')
          return
        };
        $('#dialog_alert_admin_content').html('Lưu thành công')
        $('#dialog_alert_admin').modal('show')
        $('#btn-exit-table-control').click()
      },
      error: function(error) {
        $('#dialog_alert_admin_content').html(error.responseJSON.message)
        $('#dialog_alert_admin').modal('show')
        console.error("Error:", error);
      }
    });
  }else{
    console.log(isCheckValidate.errors)
    $('#dialog_alert_admin_content').html(`Kiểm tra đúng các định dạng <br> Thời gian giờ phải là số và ít nhất là 20s và không được lớn hơn 300s (5phút) <br> Các câu trạng thái ít nhất chứa 5 kí tự <br><br>${isCheckValidate.errors}`)
    $('#dialog_alert_admin').modal('show')
  }
})

$('#btn-logout').on('click', () => {
  localStorage.setItem('_', '')
  location.reload(true);
})

function validateEditPlatforms(validationTimeCall, validationTitle, validationTitleHome, 
  validationStatusStart, validationStatusBusy, validationStatusDone, validationStatusConnect) {

  const isNumeric = (value) => /^\d+$/.test(value); 
  const isStringLengthValid = (value, minLength) => value.length >= minLength; 
  const isTimeCallValid = (value) => isNumeric(value) && parseInt(value) > 10;
  const isStringValid = (value) => isStringLengthValid(value, 5);

  const isTimeCallNaN = isNaN(parseInt(validationTimeCall));
  let errors = '';

  if (isTimeCallNaN) errors = 'Thời gian chờ nghe máy (tính theo giây) không phải là số.';
  if (!isTimeCallValid(validationTimeCall)) errors = 'Thời gian chờ nghe máy (tính theo giây) không hợp lệ.';
  if (!isStringValid(validationTitle)) errors = 'Tiêu đề chào mừng nhập tên không hợp lệ.';
  if (!isStringValid(validationTitleHome)) errors = 'Tiêu đề không hợp lệ.';
  if (!isStringValid(validationStatusStart)) errors = 'Trang thái bắt đầu gọi không hợp lệ.';
  if (!isStringValid(validationStatusBusy)) errors = 'Trang thái hỗ trợ viên bận hoặc không nhắc máy không hợp lệ.';
  if (!isStringValid(validationStatusDone)) errors = 'Trang thái người dùng đã hoàn thành xong cuộc gọi không hợp lệ.';
  if (!isStringValid(validationStatusConnect)) errors = 'Trang thái người dùng đang kết nối không hợp lệ.';

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
}