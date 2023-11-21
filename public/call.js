// const serverApi = 'http://localhost:3333'
// const serverApi = 'https://9bdd-171-232-180-235.ngrok-free.app'
// const serverApi = 'http://38.242.159.108:3333'
// const socket = io(serverApi)
const socket = io()

let room_id;
let getUserMedias = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let local_stream = null;
let peer = null;
let peer_id = ''
let currentPeer = null
let screenSharing = false
const tingTingCall = new Audio('./voice/cell-phone-ring.wav');
const busyCall = new Audio('./voice/busy-phone.wav');
const startEndCall = new Audio('./voice/start-end-call.wav');
let nameUser = 'Khong xac dinh'
let statusCall=0
let isCall=false
let audio = document.getElementById("remote-audio");
let countDownDelayCallBusyValueDefault = 60
let countDownDelayCallBusy = countDownDelayCallBusyValueDefault;
let room_id_for_my = ''

// 0 => HELP
// 1 => BUSY
// 2 => CONNECT_PENDING
// 3 => CANCEL_CALL
// 4 => END_CALL

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
    console.log(name)
    if (name.length < 3){
        alert('Vui lòng nhập tên của bạn')
    } else{
        nameUser = name
        $('#dialog_alert').modal('hide')
    }
})

$(document).ready(function() {
    const token = localStorage.getItem('_')
    $.ajax({
        type: "POST",
        url: "/admin/getConfig",
        data: { token },
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
    leaveRoom(4, true)

    // tat dem nguoc tu dong thoat
    stopCountdownCallAndLeaveRoom()
    countDownDelayCallBusy = countDownDelayCallBusyValueDefault;

    // tat dem gio cuo goi
    stopTimeCallWithAdmin()
    secondsCountDown = 0
}

function startCallAdmin(){
    $('.control-call-user').html(html_btn_loading)
    statusChange(2)
    $.ajax({
        url: `/api/user/call`,
        method: "POST",
        success: function(data) {
            if(data){
                console.log('tong dai vien ban ...')
                statusChange(1)
                $('.control-call-user').html(html_btn_call)
            }else{
                console.log('dang goi ...')
                // createRoom()
                createRoomWithRetry()
            }
        },
        error: function(error) {
            console.error("Lỗi khi thực hiện GET request:", error);
        }
    });
}

function createRoomWithRetry() {
    let roomCreated = false;

    function createRoom() {
        room_id = socket.id + Date.now();
        peer = null
        peer = new Peer(room_id);

        peer.on('open', (id) => {
            peer_id = id;

            console.log("Peer ID  : ", peer_id);
            console.log("SOCKET ID: ", socket.id);
            console.log("room_id  : ", room_id);

            navigator.getUserMedia({ audio: true }, (stream) => {
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
                console.log('nhan duoc cuoc goi');
                endCalling();
                startEndCall.play();
                startTimeCall();
                stopCountdownCallAndLeaveRoom();
                console.log('nhan duoc audio tu admin :', stream);
                setRemoteAudioStream(stream);
            });
            currentPeer = call;
        });
    }

    createRoom();

    setTimeout(() => {
        if (!roomCreated) {
            console.log("Failed to create room. Retrying...");
            createRoomWithRetry()
        }
    }, 2000);
}


// nhan ngat du lieu tu admin
socket.on('leave_room_admin', payload => {
    if(payload.room_id == room_id_for_my){
        console.log('admin ngat may')
        $('.control-call-user').html(html_btn_call)

        leaveRoom(4, false)

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
function leaveRoom(status = 4, whoIsEndCall = true) {
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

function statusChange(statusNumber) {
    let statusMsg = 'Loading ...'
    switch (statusNumber) {
        case 0:
            statusMsg = STATUS_CALL.HELP
            break;
        case 1:
            statusMsg = STATUS_CALL.BUSY
            break;
        case 2:
            statusMsg = STATUS_CALL.CONNECT_PENDING
            break;
        case 3:
            statusMsg = STATUS_CALL.CANCEL_CALL
            break;
        case 4:
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
            
            leaveRoom(1)
            busyCall.play()
            console.log('Hiện tại các tổng đài viên không thể tiếp nhận cuộc gọi, hệ thống đã tự động tắt cuộc gọi.');
        }
        console.log('countDownDelayCallBusy => ', countDownDelayCallBusy)
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
    secondsCountDown = 0;
}

function updateStatusCountTimeCall() {
    const hours = Math.floor(secondsCountDown / 3600);
    const minutes = Math.floor((secondsCountDown % 3600) / 60);
    const remainingSeconds = secondsCountDown % 60;
    const formattedTime = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(remainingSeconds)}`;
    
    countTimeCall = formattedTime
    console.log('thoi gian noi chuyen => ',formattedTime)
    $('.u-content p').text(formattedTime);
}

function formatTime(value) {
    return value < 10 ? `0${value}` : value;
}
