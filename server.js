const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let players = {}; // 접속한 플레이어 명단

io.on('connection', (socket) => {
    console.log('클라이언트 접속 (아직 게임 참가 안함): ' + socket.id);

    // 1. [중요] 사용자가 '입장' 버튼을 눌러서 닉네임을 보냈을 때만 실행
    socket.on('join_game', (nickname) => {
        console.log('게임 참가: ' + nickname + ' (' + socket.id + ')');

        // 플레이어 정보 생성 (이름 추가됨!)
        players[socket.id] = {
            x: 400,
            y: 300,
            playerId: socket.id,
            name: nickname // 닉네임 저장
        };

        // 접속한 사람에게: "현재 있는 모든 플레이어 정보 줄게"
        socket.emit('currentPlayers', players);

        // 이미 있던 사람들에게: "새 친구(이름 포함)가 왔어!"
        socket.broadcast.emit('newPlayer', players[socket.id]);
    });

    // 2. 플레이어 움직임
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 3. 플레이어 퇴장
    socket.on('disconnect', () => {
        console.log('연결 끊김: ' + socket.id);
        if (players[socket.id]) {
            delete players[socket.id];
            io.emit('playerDisconnected', socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다!`);
});