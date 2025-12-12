const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// 정적 파일 제공 (index.html 등을 보여줌)
app.use(express.static(__dirname));

// 접속한 플레이어들을 명단에 적어둠
let players = {};

io.on('connection', (socket) => {
    console.log('새로운 플레이어 접속: ' + socket.id);

    // 1. 새 플레이어 정보 생성
    players[socket.id] = {
        x: 400,
        y: 300,
        playerId: socket.id
    };

    // 2. 접속한 사람에게 "현재 있는 모든 플레이어 정보"를 줌
    socket.emit('currentPlayers', players);

    // 3. 이미 있던 다른 사람들에게 "새 친구가 왔어!"라고 알림
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // 4. 플레이어가 움직일 때마다
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // 다른 사람들에게 "얘 움직였어!"라고 알림
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 5. 플레이어가 나갔을 때
    socket.on('disconnect', () => {
        console.log('플레이어 퇴장: ' + socket.id);
        delete players[socket.id];
        io.emit('disconnect', socket.id); // 모두에게 "얘 나갔어" 알림
    });
});

// 서버를 3000번 포트에서 실행
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다!`);
});