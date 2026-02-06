require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { PORT} = require('./src/constants');
const { getDatabase } = require('./src/database');

const gameState = require('./src/gameState');
const registerUserHandler = require('./src/handlers/userHandler');
const registerGameHandler = require('./src/handlers/gameHandler');
const registerEmojiHandler = require('./src/handlers/emojiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

async function initApp() {
    const db = await getDatabase();
    await db.read();

    if (db.data && db.data.gameState) {
        // Only copy users and revealed state
        gameState.users = db.data.gameState.users || [];
        gameState.revealed = db.data.gameState.revealed || false;
    }

    db.data.gameState = gameState;

    // Clear up on server restart
    gameState.users.forEach(u => {
        u.socketId = null;
        u.vote = null;
    });

    gameState.revealed = false;

    await db.write();

    io.on('connection', (socket) => {

        socket.emit('init_constants', { 
        deck: require('./src/constants').ESTIMATION_VALUES,
        emojis: require('./src/constants').ALLOWED_EMOJIS
        });

        registerUserHandler(io, socket, gameState, db);
        registerGameHandler(io, socket, gameState, db);
        registerEmojiHandler(io, socket, gameState, db);
    });

    server.listen(PORT, () => console.log(`Planning Poker running on ${PORT}`));
}

initApp();