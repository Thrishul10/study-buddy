const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (Frontend)
app.use(express.static(__dirname));

// Track online users
let onlineUsers = 0;

io.on('connection', (socket) => {
    console.log('A user connected');
    onlineUsers++;
    // Update all clients with online user count
    io.emit('update-users', onlineUsers);

    // Handle user joining
    socket.on('user-joined', (email) => {
        console.log(`${email} joined the chat`);
    });

    // Handle message sending
    socket.on('send-message', (data) => {
       
        io.emit('receive-message', data); // Broadcast to all users
    });

   
    // Handle disconnection
    socket.on('disconnect', () => {
        
        console.log('A user disconnected');
        onlineUsers--;
        io.emit('update-users', onlineUsers);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
   
    console.log(`Server is running on http://localhost:${PORT}`);
});
