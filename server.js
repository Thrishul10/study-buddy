const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (Frontend)
app.use(express.static(__dirname));

// Track online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on('user-joined', (email) => {
        onlineUsers.set(socket.id, email);
        console.log(`${email} joined`);

        // Notify all users of the updated list
        io.emit('update-users', {
            count: onlineUsers.size,
            users: Array.from(onlineUsers.values()),
        });
    });

    // Handle chat request
    socket.on('chat-request', (data) => {
        const { toEmail, fromEmail } = data;
        const recipientSocketId = [...onlineUsers].find(([id, email]) => email === toEmail)?.[0];

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('chat-request', { fromEmail });
        }
    });

    // Handle chat acceptance
    socket.on('chat-accept', (data) => {
        const { fromEmail, toEmail } = data;

        const fromSocketId = [...onlineUsers].find(([id, email]) => email === fromEmail)?.[0];
        const room = `${fromEmail}-${toEmail}`;

        // Notify both users to join the room
        if (fromSocketId) {
            socket.join(room);
            io.to(fromSocketId).emit('chat-accepted', { room });
            socket.emit('chat-accepted', { room });
        }
    });

    // Handle private messaging
    socket.on('send-message', (data) => {
        const { room, message, sender } = data;
        io.to(room).emit('receive-message', { message, sender });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        onlineUsers.delete(socket.id);

        // Notify all users of the updated list
        io.emit('update-users', {
            count: onlineUsers.size,
            users: Array.from(onlineUsers.values()),
        });
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
