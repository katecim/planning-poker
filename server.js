require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Import constants, database, and game state 
const { PORT, ALLOWED_EMOJIS, ESTIMATION_VALUES } = require('./src/constants');
const { getDatabase, normalizeDatabaseData } = require('./src/database');
const gameState = require('./src/gameState');
const createGameService = require('./src/gameService');

// Import handlers
const registerUserHandler = require('./src/handlers/userHandler');
const registerGameHandler = require('./src/handlers/gameHandler');
const registerEmojiHandler = require('./src/handlers/emojiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json({ limit: '4kb' }));
app.set('trust proxy', 1);

async function initApp() {
    const db = await getDatabase();
    await db.read();

    db.data = normalizeDatabaseData(db.data);
    gameState.users = db.data.users.filter(user =>
        user && typeof user.id === 'string' &&
        typeof user.sessionTokenHash === 'string' &&
        user.sessionExpiresAt > Date.now()
    );
    gameState.revealed = db.data.revealed;
    if (gameState.users.length && !gameState.users.some(user => user.isAdmin)) {
        gameState.users[0].isAdmin = true;
    }
    db.data.users = gameState.users;
    await db.write();

    const gameService = createGameService({ io, gameState, db });
    registerUserHandler(app, io, gameState, gameService);

    io.on('connection', (socket) => {
        socket.join(`user:${socket.data.userId}`);
        socket.use((packet, next) => {
            const user = gameState.findUserById(socket.data.userId);
            if (!user || user.sessionExpiresAt <= Date.now()) {
                socket.disconnect(true);
                return next(new Error('Unauthorized'));
            }
            next();
        });

        // Send initial constants to the client
        socket.emit('init_constants', { 
            deck: ESTIMATION_VALUES,
            emojis: ALLOWED_EMOJIS,
            currentBg: gameState.currentBg || 'casino'
        });

        registerGameHandler(socket, gameState, gameService);
        registerEmojiHandler(io, socket);
        gameService.emitCurrentState(socket);
    });

    server.listen(PORT, () => console.log(`Planning Poker running on ${PORT}`));
}

initApp();