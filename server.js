const express = require('express'); 
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (Frontend)
app.use(express.static(__dirname));

// Object to track online users in each subject
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user joining a subject-based chat room
    socket.on('join-room', ({ subject, email }) => {
        socket.join(subject);

        // Track users in the room
        if (!rooms[subject]) {
            rooms[subject] = new Set();
        }
        rooms[subject].add(socket.id);

        console.log(`${email} joined ${subject} room`);
        
        // Update online user count in that room
        io.to(subject).emit('update-users', rooms[subject].size);
    });

    // Handle message sending within a subject room
    socket.on('send-message', (data) => {
        io.to(data.subject).emit('receive-message', data);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        for (let subject in rooms) {
            if (rooms[subject].has(socket.id)) {
                rooms[subject].delete(socket.id);
                io.to(subject).emit('update-users', rooms[subject].size);
                console.log(`A user left ${subject} room`);
            }
        }
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
