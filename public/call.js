// const serverApi = 'http://localhost:3333'
const serverApi = 'http:/38.242.159.108:3333'
const socket = io(serverApi)

const SUF = "MEET"
let room_id;
let getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
let local_stream;
let peer = null;
let peer_id = ''
let currentPeer = null
let screenSharing = false
const tingTingCall = new Audio('./cell-phone-ring.wav');
let nameUser = 'Khong xac dinh'
let statusCall=0
let isCall=false
let audio = document.getElementById("remote-audio");
let isCheckConnection = false
const countDownDelayCallBusyValueDefault = 60
let countDownDelayCallBusy = countDownDelayCallBusyValueDefault;

const html_btn_call = '<div class="control-call-user"><button class="btn btn-call btn-call-user-call"><i class="fa-solid fa-phone"></i></button></div>'
const html_btn_cancel = '<div class="control-call-user"><button class="btn btn-call btn-call-user-cancel"><i class="fa-solid fa-xmark"></i></button></div>'

$('#dialog_alert').modal('show')
$('#btnGetNameUser').on('click', ()=>{
    const name = $('#getNameUser').val()
    console.log(name)
    if (name.length < 3){
        alert('Vui lòng nhập tên của bạn')
    } else{
        nameUser = name
        $('#dialog_alert').modal('hide')
    }
})

$('.control-call-user').on('click', () => {
   if(isCall){
    isCheckConnection=true
    leaveRoom()
    $('.control-call-user').html(html_btn_call)
   }else{
        statusCall = 2
        statusChange()
        $.ajax({
            url: `${serverApi}/api/user/call`,
            method: "POST",
            success: function(data) {
                if(data){
                    console.log('tong dai vien ban ...')
                    statusCall = 1
                    statusChange()
                    // tao delay
                    $('.control-call-user').html(html_btn_call)
                }else{
                    console.log('dang goi ...')
                    createRoom()
                    $('.control-call-user').html(html_btn_cancel)
                }
            },
            error: function(error) {
                console.error("Lỗi khi thực hiện GET request:", error);
            }
        });
   }
   isCall = !isCall
})

function createRoom() {
    peer = new Peer(); 
    peer.on('open', (id) => {
        peer_id = id
        room_id = socket.id + SUF;
        console.log("Peer ID  : ", id);
        console.log("SOCKET ID: ", socket.id);
        console.log("room_id: ", room_id);
        getUserMedia({ video: false, audio: true }, (stream) => {
            local_stream = stream;
            // setLocalStream(local_stream);
            socket.emit('create_room', { peer_id: id, room_id: room_id, nameUser: nameUser });
            startCountdownCallAndLeaveRoom()
        }, (err) => {
            console.log(err);
        });
        calling();
    });
    peer.on('call', (call) => {
        endCalling()
        call.answer(local_stream); // được sử dụng để trả lời một cuộc gọi và chia sẻ dữ liệu âm thanh hoặc video với người gọi.
        console.log('cos nguoi vao phong')
        call.on('stream', (stream) => {
            setRemoteAudioStream(stream)
        })
        currentPeer = call;
    })
}

// Hàm để hiển thị âm thanh từ người gọi
function setRemoteAudioStream(stream) {
    audio.srcObject = stream;
    audio.play();
}

function leaveRoom(status = 4) {
    if (peer) {
        socket.emit('leave_room', { peer_id, room_id, nameUser });
        endCalling()
        if (local_stream) {
            const audioTracks = local_stream.getAudioTracks();
            audioTracks.forEach(track => track.stop());
        }
        peer.disconnect()
        statusCall=status
        statusChange()
        $('.control-call-user').html(html_btn_call)
        countDownDelayCallBusy = countDownDelayCallBusyValueDefault
        // thong bao socket
        console.log("Left the room");
    } else {
        console.log("Not connected to any room");
    }
}

// ========================================== VOICE ==========================================

function calling(){
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
    tingTingCall.pause();
    tingTingCall.currentTime = 0;
}

// ========================================== STATUS ==========================================
function statusChange() {
    let statusMsg = 'Loading ...'
    switch (statusCall) {
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
    $('.u-content p').html(`<p>${statusMsg}</p>`)
}

function startCountdownCallAndLeaveRoom() {
    const countdownInterval = setInterval(function() {
    if(isCheckConnection){
            console.log('tong dai vien da bat may...')
            clearInterval(countdownInterval)
            isCheckConnection=false
        }
        console.log('countDownDelayCallBusy => ', countDownDelayCallBusy)
        if (countDownDelayCallBusy <= 0) {
            isCall=!isCall
            countDownDelayCallBusy = countDownDelayCallBusyValueDefault
            leaveRoom(1)
            console.log('Hiện tại các tổng đài viên không thể tiếp nhận cuộc gọi, sau 60s đã tự động tắt cuộc gọi.');
            clearInterval(countdownInterval);
        }
        countDownDelayCallBusy--;
    }, 1000); 
}

// 0 => HELP
// 1 => BUSY
// 2 => CONNECT_PENDING
// 3 => CANCEL_CALL
// 4 => END_CALL

const STATUS_CALL = {
    HELP: 'Ấn nút gọi để gặp tổng đài viên',
    BUSY: 'Tạm thời các tổng đài viên đang bận, vui lòng liên lạc lại sau...',
    CONNECT_PENDING: 'Đang kết nối đến hỗ trợ viên, vui lòng đợi...',
    CANCEL_CALL: 'Ấn để ngắt kết nối...',
    END_CALL: 'Cảm ơn bạn đã liên hệ, nếu cần hỗ trợ thêm hãy liên hệ lại chúng tôi. Thân gửi !',
    ERROR: 'Hệ thống lỗi vui lòng liên hệ lại sau',
}


// function joinRoom() {
//     let roomId = document.getElementById("idCall").value;    
//     if (roomId == " " || roomId == "") {
//         alert("Please enter room number")
//         return;
//     }
//     console.log(roomId)
//     peer = new Peer()
//     peer.on('open', (id) => {
//         console.log("Connected with Id: " + id)
//         getUserMedia({ video: false, audio: true }, (stream) => {
//             local_stream = stream;
//             setLocalStream(local_stream)
//             console.log("da vao phong")
//             let call = peer.call(roomId, stream)
//             call.on('stream', (stream) => {
//                 setRemoteStream(stream);
//             })
//             currentPeer = call;
//         }, (err) => {
//             console.log(err)
//         })
//     })
// }




// function setLocalStream(stream) {
//     let audio = document.getElementById("local-video");
//     audio.srcObject = stream;
//     audio.muted = true;
//     audio.play();
// }

// function setRemoteStream(stream) {
//     let video = document.getElementById("remote-video");
//     video.srcObject = stream;
//     video.play();
// }

