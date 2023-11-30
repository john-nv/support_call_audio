const socket = io()

let room_id, peer_id;
let peer = null;
let local_stream = null;
let getUserMediaCustom = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let nameUser = 'user'
let statusCall=0
let countDownDelayCallBusyValueDefault = 60
let countDownDelayCallBusy = countDownDelayCallBusyValueDefault;
let room_id_for_my = ''

let audio = document.getElementById("remote-audio");
const tingTingCall = new Audio('./voice/cell-phone-ring.wav');
const busyCall = new Audio('./voice/busy-phone.wav');
const startEndCall = new Audio('./voice/start-end-call.wav');

let STATUS_CALL = {
    HELP: 'Ấn nút gọi để gặp tổng đài viên',
    TIME_AWAIT_CALL: countDownDelayCallBusyValueDefault,
    TITLE: 'Hỗ trợ khách hàng',
    TITLE_HOME: 'Hỗ trợ khách hàng',
    HELP: 'Ấn nút gọi để gặp tổng đài viên',
    BUSY: 'Tạm thời các tổng đài viên đang bận, vui lòng liên lạc lại sau...',
    CONNECT_PENDING: 'Đang kết nối đến hỗ trợ viên, vui lòng đợi...',
    CANCEL_CALL: 'Ấn để ngắt kết nối...',
    END_CALL: 'Cảm ơn bạn đã liên hệ, nếu cần hỗ trợ thêm hãy liên hệ lại chúng tôi. Thân gửi !',
    ERROR: 'Hệ thống lỗi vui lòng liên hệ lại sau',
}

// dount thoi gian tu dong thoat 
let countdownInterval

const html_btn_call = '<button onclick="startCallAdmin()" class="btn btn-call btn-call-user-call"><i class="fa-solid fa-phone"></i></button>'
const html_btn_cancel = '<button onclick="stopCallAdmin()" class="btn btn-call btn-call-user-cancel"><i class="fa-solid fa-xmark"></i></button>'
const html_btn_loading = '<button class="btn btn-call"><i class="fa-solid fa-spinner"></i></button>'

// ===== COUNT TIME CALL =======
let secondsCountDown = 0
let intervalCountTimeCall
let countTimeCall = '00:00:00'

$('#btnGetNameUser').on('click', () => {
    const name = $('#getNameUser').val()
    console.log('ten nguoi dung => ', name)
    if (name.length < 1){
        alert('Vui lòng nhập tên của bạn')
    } else{
        nameUser = name
        $('#dialog_alert').modal('hide')
    }
})

$(document).ready(function() {
    $.ajax({
        type: "POST",
        url: "/admin/getConfig",
        success: function (res) {
            if (res.code != 1) return;
            console.log(res.data)
            STATUS_CALL.HELP = res.data.msgStart;
            STATUS_CALL.BUSY = res.data.msgBusy;
            STATUS_CALL.CONNECT_PENDING = res.data.msgConnect;
            STATUS_CALL.END_CALL = res.data.msgDone;
            STATUS_CALL.TITLE = res.data.titleUser;
            STATUS_CALL.TITLE_HOME = res.data.titleHome;
            STATUS_CALL.TIME_AWAIT_CALL = res.data.timeAwaitUser;
            countDownDelayCallBusyValueDefault = res.data.timeAwaitUser;

            $('#title_welcome').html(STATUS_CALL.TITLE_HOME);
            $('#title_dialog').html(STATUS_CALL.TITLE);
            $('#dialog_alert').modal('show');
        },
        error: function (error) {
            console.log('Không load được config từ admin');
            console.error("Error:", error);
        }
    });
});

function stopCallAdmin() {
    leaveRoom('END_CALL', true)

    // tat dem nguoc tu dong thoat
    stopCountdownCallAndLeaveRoom()
    countDownDelayCallBusy = countDownDelayCallBusyValueDefault;

    // tat dem gio cuoc goi
    stopTimeCallWithAdmin()
    secondsCountDown = 0
}

function startCallAdmin(){
    $('.control-call-user').html(html_btn_loading)
    statusChange('CONNECT_PENDING')
    $.ajax({
        url: `/api/user/call`,
        method: "POST",
        success: function(data) {
            if(data){
                console.log('tong dai vien ban ...')
                statusChange('BUSY')
                $('.control-call-user').html(html_btn_call)
            }else{
                console.log('dang goi ...')
                createRoom()
            }
        },
        error: function(error) {
            console.error("Lỗi khi thực hiện GET request:", error);
        }
    });
}

async function createRoom() {
    room_id = socket.id + Date.now();
    peer = null
    peer = await new Peer(room_id, {host: '/', port: 9000,});
    console.log('peer => ', peer)
    peer.on('open', (id) => {
        peer_id = id;

        console.log("Peer ID  : ", peer_id);
        console.log("SOCKET ID: ", socket.id);
        console.log("room_id  : ", room_id);
        
        // navigator.getUserMedia({ audio: true }, (stream) => {
        getUserMediaCustom({ audio: true }, (stream) => {
            local_stream = stream;
            console.log('User info :', local_stream);
            room_id_for_my = room_id;
            socket.emit('create_room', { peer_id: id, room_id: room_id, nameUser: nameUser });
            $('.control-call-user').html(html_btn_cancel);

            calling();
            startCountdownCallAndLeaveRoom();
            roomCreated = true;
        }, (err) => {
            console.log('User getUserMedia error:', err);
            // Set roomCreated to false in case of error
            roomCreated = false;
        });
    });

    peer.on('call', (call) => {
        call.answer(local_stream);
        console.log('audio de truyen audio den admin ', local_stream)
        call.on('stream', (stream) => {
            console.log('admin vao phong');
            endCalling();
            startEndCall.play();
            startTimeCall();
            stopCountdownCallAndLeaveRoom();
            console.log('nhan duoc audio tu admin :', stream);
            setRemoteAudioStream(stream);
        });
    });
}


// nhan ngat du lieu tu admin
socket.on('leave_room_admin', payload => {
    if(payload.room_id == room_id_for_my){
        console.log('admin ngat may')
        $('.control-call-user').html(html_btn_call)

        leaveRoom('END_CALL', false)

        // tat dem gio cuo goi
        stopTimeCallWithAdmin()
        secondsCountDown = 0
    }
})

function setRemoteAudioStream(stream) {
    audio.srcObject = stream;
    audio.play();
}

// ========================================== leave Room ==========================================
// whoIsEndCall 
// true => user
// false => admin
function leaveRoom(status = 'END_CALL', whoIsEndCall = true) {
    whoIsEndCall = whoIsEndCall ? 'USER' : 'ADMIN'
    if (peer && peer.open) {
        socket.emit('leave_room', { peer_id, room_id, nameUser, countTimeCall, whoIsEndCall });
        disconnectPeer()
        if (local_stream) {
            const audioTracks = local_stream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks.forEach(track => track.stop());
            }
        }
        
        statusChange(status)
        room_id_for_my = ''
        $('.control-call-user').html(html_btn_call)
        countDownDelayCallBusy = countDownDelayCallBusyValueDefault
        // thong bao socket
        console.log("thoat cuoc tro chuyen");
    } else {
        console.log("Not connected to any room");
    }
}

function disconnectPeer(){
    if(!peer) return
    startEndCall.play()
    endCalling()
    console.log('disconnect peer')
    peer.destroy();
    peer = null
}

// ========================================== VOICE ==========================================

function calling(){
    console.log('bat dau am thanh goi - ting ting')
    if (!tingTingCall.paused) {
        tingTingCall.pause();
        tingTingCall.currentTime = 0;
    }
    tingTingCall.play();
}

tingTingCall.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
});

function endCalling(){
    console.log('ket thuc am thanh goi - ting ting')
    tingTingCall.pause();
    tingTingCall.currentTime = 0;
}

// ========================================== STATUS ==========================================

function statusChange(status) {
    let statusMsg = 'Loading ...'
    switch (status) {
        case 'HELP':
            statusMsg = STATUS_CALL.HELP
            break;
        case 'BUSY':
            statusMsg = STATUS_CALL.BUSY
            break;
        case 'CONNECT_PENDING':
            statusMsg = STATUS_CALL.CONNECT_PENDING
            break;
        case 'CANCEL_CALL':
            statusMsg = STATUS_CALL.CANCEL_CALL
            break;
        case 'END_CALL':
            statusMsg = STATUS_CALL.END_CALL
            break;
    
        default:
            statusMsg = STATUS_CALL.ERROR
            break;
    }
    $('.u-content p').html(`${statusMsg}`)
}

// Hàm để hiển thị âm thanh từ người gọi
function setRemoteAudioStream(stream) {
    audio.srcObject = stream;
    audio.play();
}

function startCountdownCallAndLeaveRoom() {
    countdownInterval = setInterval(function() {
        if (countDownDelayCallBusy <= 0) {
            stopCountdownCallAndLeaveRoom()
            countDownDelayCallBusy = countDownDelayCallBusyValueDefault
            
            leaveRoom('BUSY')
            busyCall.play()
            console.log('tong dai vien ban,countdown tu choi cuoc goi.');
        }
        console.log('dem nguoc tu dong ngat may => ', countDownDelayCallBusy)
        countDownDelayCallBusy--;
    }, 1000);
}

function stopCountdownCallAndLeaveRoom() {
    console.log('ngừng countdown thời gian và tự động thoát')
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countDownDelayCallBusy = countDownDelayCallBusyValueDefault;
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
    resetTimeCall()
}

function updateStatusCountTimeCall() {
    const hours = Math.floor(secondsCountDown / 3600);
    const minutes = Math.floor((secondsCountDown % 3600) / 60);
    const remainingSeconds = secondsCountDown % 60;
    const formattedTime = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(remainingSeconds)}`;
    
    countTimeCall = formattedTime
    console.log('dem thoi gian goi => ',formattedTime)
    $('.u-content p').text(formattedTime);
}

function formatTime(value) {
    return value < 10 ? `0${value}` : value;
}

function resetTimeCall(){
    secondsCountDown = 0
    countTimeCall = '00:00:00'
}