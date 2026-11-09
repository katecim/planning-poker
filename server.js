const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Import constants, database, and game state 
const { PORT, ALLOWED_EMOJIS, ESTIMATION_VALUES, SECURITY } = require('./src/constants');
const { getDatabase } = require('./src/database');
const gameState = require('./src/gameState');
const createGameService = require('./src/gameService');
const createPresenceManager = require('./src/presenceManager');

// Import handlers
const registerUserHandler = require('./src/handlers/userHandler');
const registerGameHandler = require('./src/handlers/gameHandler');
const registerEmojiHandler = require('./src/handlers/emojiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '4kb' }));
app.set('trust proxy', 1);

async function initApp() {
    const db = await getDatabase();
    await db.read();

    db.data = { users: [], revealed: false };
    gameState.users = db.data.users;
    gameState.revealed = db.data.revealed;
    await db.write();

    const gameService = createGameService({ io, gameState, db });
    const presenceManager = createPresenceManager({
        io,
        gameState,
        gameService,
        gracePeriodMs: SECURITY.DISCONNECT_GRACE_PERIOD_MS
    });
    registerUserHandler(app, io, gameState, gameService, presenceManager);

    io.on('connection', (socket) => {
        presenceManager.handleConnection(socket);
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
            currentBg: gameState.currentBg || 'halloween'
        });

        registerGameHandler(socket, gameState, gameService);
        registerEmojiHandler(io, socket);
        gameService.emitCurrentState(socket);
    });

    server.listen(PORT, () => console.log(`Planning Poker running on ${PORT}`));
}

initApp();