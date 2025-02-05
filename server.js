const express = require('express'); 
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: "*",  // Allow frontend requests from any origin
        methods: ["GET", "POST"]
    }
});

let onlineUsers = {}; // Stores online users and their socket IDs

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    let currentEmail = null;

    // Handle user joining
    socket.on('user-joined', (email) => {
        currentEmail = email;
        onlineUsers[email] = socket.id; // Store email with socket ID
        console.log(`User joined: ${email}`);
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
        const room = [from, to].sort().join('-'); // Create consistent room name
        socket.join(room);
        const toSocketId = onlineUsers[to];

        if (toSocketId) {
            io.to(toSocketId).emit('chat-accepted', { room, from });
            io.to(socket.id).emit('chat-accepted', { room, to });
        }
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
        if (currentEmail && onlineUsers[currentEmail]) {
            delete onlineUsers[currentEmail];
            updateUsersList();
        }
        console.log('User disconnected:', socket.id);
    });

    // Send updated users list to all clients
    function updateUsersList() {
        io.emit('update-users', {
            onlineUsers: Object.keys(onlineUsers),
            count: Object.keys(onlineUsers).length,
        });
    }
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});
