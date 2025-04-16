const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', ({ subject, email }) => {
        socket.join(subject);
        if (!rooms[subject]) {
            rooms[subject] = new Set();
        }
        rooms[subject].add(socket.id);
        console.log(`${email} joined ${subject} room`);

        io.to(subject).emit('update-room-users', rooms[subject].size);
    });

    socket.on('send-message', (data) => {
        io.to(data.subject).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
        for (let subject in rooms) {
            if (rooms[subject].has(socket.id)) {
                rooms[subject].delete(socket.id);
                io.to(subject).emit('update-room-users', rooms[subject].size);
                console.log(`A user left ${subject} room`);
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
