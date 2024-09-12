console.log('Starting application...');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { ExpressPeerServer } = require('peer');
require('dotenv').config();

console.log('Modules loaded');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

console.log('Express and Socket.IO initialized');

// Cấu hình PeerServer
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerserver'
});

app.use('/peerjs', peerServer);

console.log('PeerServer configured');

// Serve static files
app.use(express.static('public'));

console.log('Static files configured');

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('NGUOI_DUNG_DANG_KY', (data) => {
    console.log('User registered:', data);
    io.emit('DANH_SACH_ONLINE', [data]);
    socket.broadcast.emit('CO_NGUOI_DUNG_MOI', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    io.emit('USER_DISCONNECTED', socket.id);
  });
});

console.log('Socket.IO logic set up');

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('Server listen called');

// Existing client-side code
console.log('Client-side code starts here');
/////////////////////   Client
let localStream;
let remoteStream;
// var peer = null;
let isCameraOn = true;
let isMicOn = true;
const socket = io();

// Đảm bảo rằng đoạn mã javacript đã được thực thi khi DOM đc hoành thành
$(document).ready(function () {
    // Create a new Peer instance

    try {
        peer = new Peer(peerjs, {
            host: process.env.PEER_HOST || window.location.hostname,
            port: process.env.PEER_PORT,
            path: process.env.PEER_PATH,
            secure: process.env.PEER_SECURE === 'true'
        });
    } catch (error) {
        console.error('Error initializing Peer:', error);
    }

    peer.on('open', function (id) {
        // Display the peer ID in the 'mydiv' element
        $("#mydiv").text("Your ID: " + id);
        console.log("Your ID: " + id);

        $('#btnSignUp').click(() => {
            const username = $('#txtUsername').val();
            socket.emit('NGUOI_DUNG_DANG_KY', { name: username, peerId: id });
        });
    });

    $('#div-chat').hide();

    socket.on('DANH_SACH_ONLINE', arrUserInfo => {
        $('#div-chat').show();
        $('#div-dang-ky').hide();

        arrUserInfo.forEach(user => {
            const { name, peerId } = user;
            $('#ulUser').append(`<li id="${peerId}">${name}</li>`);
        });

        socket.on('CO_NGUOI_DUNG_MOI', user => {
            const { name, peerId } = user;
            $('#ulUser').append(`<li id="${peerId}">${name}</li>`);
        });

        socket.on('USER_DISCONNECTED', peerId => {
            $(`#${peerId}`).remove(); //goi dc $ o peeerId vi da cho peerId vao tung the <li></li>
        });
    });

    socket.on('DANG_KY_THAT_BAI', () => alert('Vui long chon username khac!'));


    function openStream() {
        const config = { audio: true, video: true };
        return navigator.mediaDevices.getUserMedia(config);
    }

    function playStream(idVideoTag, stream) {
        const video = document.getElementById(idVideoTag);
        video.srcObject = stream;
        video.play();
    }

    openStream().then(stream => {
        localStream = stream;
        playStream('localStream', localStream)
    });


    // Bật/tắt camera
    function toggleCamera() {
        isCameraOn = !isCameraOn;
        localStream.getVideoTracks()[0].enabled = isCameraOn;

        // Gửi tín hiệu cho đối phương qua Data Channel
        dataChannel.send(JSON.stringify({ type: 'cameraToggle', isCameraOn: isCameraOn }));
    }

    function toggleMicrophone() {
        isMicOn = !isMicOn;
        localStream.getAudioTracks()[0].enabled = isMicOn;

        // Gửi tín hiệu cho đối phương qua Data Channel
        dataChannel.send(JSON.stringify({ type: 'microphoneToggle', isMicOn: isMicOn }));
    }

    $('#cameraBtn').click(toggleCamera);
    $('#micBtn').click(toggleMicrophone);

    // Xử lý sự kiện Data Channel
    peer.on('data', data => {
        const message = JSON.parse(data);

        if (message.type === 'cameraToggle') {
            const { isCameraOn } = message;
            toggleRemoteCamera(isCameraOn);
        } else if (message.type === 'microphoneToggle') {
            const { isMicOn } = message;
            toggleRemoteMicrophone(isMicOn);
        }
    });


    //quiz
    const optionMenu = document.querySelector(".quiz-menu"),
        selectBtn = optionMenu.querySelector(".select-btn"),
        options = optionMenu.querySelectorAll(".option"),
        sBtn_text = optionMenu.querySelector(".sBtn-text");

    selectBtn.addEventListener("click", () => optionMenu.classList.toggle("active"));

    options.forEach(option => {
        option.addEventListener("click", () => {
            let selectedOption = option.querySelector(".option-text").innerText;
            sBtn_text.innerText = selectedOption;

            optionMenu.classList.remove("active");
        });
    });


    // Caller: người gọi
    $("#btnCall").click(() => {
        const id = $("#remoteID").val();
        openStream()
            .then(stream => {
                playStream('localStream', stream);
                const call = peer.call(id, stream);
                call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
            });
    })
    // Callee: người nhận
    peer.on('call', call => {
        openStream()
            .then(stream => {
                call.answer(stream);
                playStream('localStream', stream);
                call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
            });
    });

    // socket.on('connect', () => {
    //     console.log('Connected to the server');
    // });

    $('#ulUser').on('click', 'li', function () {
        const id = $(this).attr('id');

        openStream()
            .then(stream => {
                playStream('localStream', stream);
                const call = peer.call(id, stream);
                call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
            });
    });

});



////////////////////////////////////

/*const CONFIG_NON_STUN_TURN_SERVER = {
    host: "127.0.0.1",
    port: 9090,
    path: '/peerserver'    
};

let peer = new Peer('null', CONFIG_NON_STUN_TURN_SERVER);*/
