const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = {}; // Stores online users and their socket IDs

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('user-joined', (email) => {
        onlineUsers[email] = socket.id; // Map email to socket ID
        console.log('User joined:', email);
        updateUsersList();
    });

    // Handle sending a chat request
    socket.on('send-request', ({ from, to }) => {
        const toSocketId = onlineUsers[to];
        if (toSocketId) {
            io.to(toSocketId).emit('chat-request', from);
        }
    });

    // Handle accepting a chat request
    socket.on('accept-request', ({ from, to }) => {
        const room = `${from}-${to}`;
        io.to(onlineUsers[from]).emit('chat-accepted', room);
        io.to(onlineUsers[to]).emit('chat-accepted', room);
    });

    // Handle joining a room
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`${socket.id} joined room: ${room}`);
    });

    // Handle sending messages in a room
    socket.on('send-message', ({ room, message }) => {
        io.to(room).emit('receive-message', message);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        for (const email in onlineUsers) {
            if (onlineUsers[email] === socket.id) {
                delete onlineUsers[email];
                break;
            }
        }
        updateUsersList();
        console.log('User disconnected:', socket.id);
    });

    // Send updated users list to all clients
    function updateUsersList() {
        io.emit('update-users', Object.keys(onlineUsers));
    }
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
