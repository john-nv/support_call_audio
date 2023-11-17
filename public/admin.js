// const socket = io('http://localhost:3333');
const socket = io('http://127.0.0.1:3333');
let room_chat_id
let busy = false
const beforeNameRoom = 'peer'
const STATUS_MES_USER = {
  BUSY: 'Đã tự động từ chối cuộc gọi hoặc người dùng tự rời đi',
  NEW: 'Bạn có cuộc gọi đến',
  ACCEPT: 'Bạn đã chấp nhận cuộc gọi',
  CANCEL: 'Bạn đã từ chối cuộc gọi',
}

// user doi qua lau hoac tu dong tu choi cuoc goi
socket.on('leave_room_admin', payload => {
  const { peer_id, room_id, nameUser, time } = payload;
  const roomIdLeave = beforeNameRoom + room_id;
  console.log('Đã rời cuộc gọi');

  const $inboxMElement = $('.inbox-m.' + CSS.escape(roomIdLeave));
  $inboxMElement.find('.inbox-m-message span').text(STATUS_MES_USER.BUSY);
  $inboxMElement.removeClass('mes-active').addClass('mes-cancel');
});

socket.on('create_room_admin', payload => {
  const  { peer_id, room_id, nameUser, time } = payload;
  console.log(`newRoom => ${JSON.stringify(payload)}`);
  room_chat_id = room_id

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
  let status = 0
  var nameUser = $(this).find('.inbox-m-name span').text();
  var messageUser = $(this).find('.inbox-m-message span').text();
  if ($(this).hasClass('mes-active')) status = 1;
  if ($(this).hasClass('mes-cancel')) status = 2;

  switch (status) {
    case 1:
      phone = `
              <div class="inbox-m-show-main-content">
                  <h6>${nameUser}</h6>
                  <span>${messageUser}</span>
                  <div class="d-flex justify-content-between">
                      <button class="btn btn-call btn-call-close"><i class="fa-solid fa-xmark"></i></button>
                      <button class="btn btn-call btn-call-accept"><i class="fa-solid fa-phone"></i></button>
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
  }
  $('.inbox-m-show-main').html(phone)
});



