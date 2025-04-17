const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS, etc.)

const rooms = {}; // Track users in each room

io.on('connection', (socket) => {
    console.log('A user connected');

    // User joins a room
    socket.on('join-room', ({ subject, email }) => {
        socket.join(subject);
        if (!rooms[subject]) {
            rooms[subject] = new Set();
        }
        rooms[subject].add(socket.id);

        console.log(`${email} joined ${subject} room`);

        // Update all users in the room about the new count
        io.to(subject).emit('update-room-users', rooms[subject].size);
    });

    // User leaves a room manually (goBack on client)
    socket.on('leave-room', ({ subject, userEmail }) => {
        if (rooms[subject] && rooms[subject].has(socket.id)) {
            rooms[subject].delete(socket.id);
            socket.leave(subject);
            console.log(`${userEmail} left ${subject} room`);

            // Update room user count
            io.to(subject).emit('update-room-users', rooms[subject].size);
        }
    });

    // User sends a message
    socket.on('send-message', (data) => {
        // Emit to all others in the room
        socket.to(data.subject).emit('receive-message', data);
        // Emit to sender as well (prevents duplicate rendering logic on client)
        socket.emit('receive-message', data);
    });

    // User disconnects (browser/tab closed)
    socket.on('disconnect', () => {
        for (let subject in rooms) {
            if (rooms[subject].has(socket.id)) {
                rooms[subject].delete(socket.id);
                io.to(subject).emit('update-room-users', rooms[subject].size);
                console.log(`A user disconnected from ${subject} room`);
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
