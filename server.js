require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Import constants, database, and game state 
const { PORT, ALLOWED_EMOJIS, ESTIMATION_VALUES } = require('./src/constants');
const { getDatabase } = require('./src/database');
const gameState = require('./src/gameState');

// Import handlers
const registerUserHandler = require('./src/handlers/userHandler');
const registerGameHandler = require('./src/handlers/gameHandler');
const registerEmojiHandler = require('./src/handlers/emojiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

async function initApp() {
    const db = await getDatabase();
    // Initialize game state (clear users and reset revealed state)
    gameState.users = [];
    gameState.revealed = false;

    db.data = { gameState };
    await db.write();

    io.on('connection', (socket) => {
        // Send initial constants to the client
        socket.emit('init_constants', { 
            deck: ESTIMATION_VALUES,
            emojis: ALLOWED_EMOJIS,
            currentBg: gameState.currentBg || 'casino'
        });

        registerUserHandler(io, socket, gameState, db);
        registerGameHandler(io, socket, gameState, db);
        registerEmojiHandler(io, socket);
    });

    server.listen(PORT, () => console.log(`Planning Poker running on ${PORT}`));
}

initApp();