const socket = io("http://localhost:5000"); // Connect to the backend
let currentUser = "";

// Handle login
function handleLogin() {
    const email = document.getElementById("email").value;
    if (email.trim() === "") {
        alert("Please enter a valid email.");
        return;
    }

    currentUser = email;
    localStorage.setItem("currentUser", email); // Store user email
    document.getElementById("login-container").style.display = "none";
    document.getElementById("chat-container").style.display = "block";

    socket.emit("user-joined", email); // Notify the server
}

// Listen for online users update
socket.on("update-users", ({ onlineUsers, count }) => {
    console.log("Updated online users:", onlineUsers, count);
    
    document.getElementById("online-users-count").innerText = count; 

    const usersList = document.getElementById("users-list");
    usersList.innerHTML = ""; // Clear existing list

    onlineUsers.forEach(user => {
        if (user !== currentUser) { // Don't show yourself in the list
            const listItem = document.createElement("li");
            listItem.innerText = user;

            const requestButton = document.createElement("button");
            requestButton.innerText = "Request Chat";
            requestButton.onclick = () => sendChatRequest(user);

            listItem.appendChild(requestButton);
            usersList.appendChild(listItem);
        }
    });
});

// Send a chat request to another user
function sendChatRequest(toUser) {
    socket.emit("send-request", { from: currentUser, to: toUser });
    alert(`Chat request sent to ${toUser}`);
}

// Listen for incoming chat requests
socket.on("chat-request", (fromUser) => {
    if (confirm(`${fromUser} wants to chat. Accept?`)) {
        socket.emit("accept-request", { from: fromUser, to: currentUser });
    }
});

// Handle chat acceptance
socket.on("chat-accepted", ({ room, from }) => {
    alert(`Chat started with ${from}`);
    socket.emit("join-room", room);
});

// Handle sending messages
function sendMessage() {
    const message = document.getElementById("message").value;
    const room = localStorage.getItem("currentRoom");

    if (message.trim() !== "") {
        socket.emit("send-message", { room, message });
        document.getElementById("message").value = "";
    }
}

// Listen for incoming messages
socket.on("receive-message", (message) => {
    const messagesContainer = document.getElementById("messages");
    const messageElement = document.createElement("p");
    messageElement.innerText = message;
    messagesContainer.appendChild(messageElement);
});
