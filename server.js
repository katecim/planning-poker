const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Game State
let gameState = {
    users: [], // { id: 'socketId', name: 'User', vote: null, isAdmin: boolean }
    revealed: false
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle User Join
    socket.on('join', (name) => {
        const isAdmin = gameState.users.length === 0; // First user is Admin
        const newUser = { id: socket.id, name, vote: null, isAdmin };
        gameState.users.push(newUser);
        io.emit('update', gameState);
    });

    // Handle Vote
    socket.on('vote', (value) => {
        const user = gameState.users.find(u => u.id === socket.id);
        if (user) {
            user.vote = value;
            io.emit('update', gameState);
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', () => {
        const user = gameState.users.find(u => u.id === socket.id);
        if (user && user.isAdmin) {
            gameState.revealed = true;
            io.emit('update', gameState);
        }
    });

    // Handle New Session (Admin only)
    socket.on('reset', () => {
        const user = gameState.users.find(u => u.id === socket.id);
        if (user && user.isAdmin) {
            gameState.revealed = false;
            gameState.users.forEach(u => u.vote = null); // Reset votes
            io.emit('update', gameState);
        }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        gameState.users = gameState.users.filter(u => u.id !== socket.id);
        
        // If Admin left, assign new Admin to the next person
        if (gameState.users.length > 0 && !gameState.users.some(u => u.isAdmin)) {
            gameState.users[0].isAdmin = true;
        }
        
        io.emit('update', gameState);
    });

    // Handle Emoji Reactions
    socket.on('reaction', (emoji) => {
        io.emit('reaction', emoji);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Poker planning running on http://localhost:${PORT}`);
});