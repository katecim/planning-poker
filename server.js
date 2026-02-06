require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { PORT, ALLOWED_EMOJIS, ESTIMATION_VALUES, SECURITY } = require('./src/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Reaction locks to prevent spam
const reactionLocks = new Map();

let gameState = {
    users: [], // { persistentId: 'uuid', socketId: 'sid', name: 'User', vote: null, isAdmin: boolean }
    revealed: false
};

io.on('connection', (socket) => {
    
    // Handle User Join
    socket.on('join', ({ name, persistentId }) => {
        socket.emit('init_constants', { 
            deck: ESTIMATION_VALUES,
            emojis: ALLOWED_EMOJIS
        });

        // Sanitize name input to prevent XSS and limit length
        let cleanName = name.replace(SECURITY.NAME_SANITIZATION_REGEX, '').trim().substring(0, SECURITY.MAX_NAME_LENGTH);
        if (!cleanName) cleanName = "Anonymous Gopher";

        // Check if this user already exists in the session
        let user = gameState.users.find(u => u.persistentId === persistentId);

        if (user) {
            // Reconnect user
            user.socketId = socket.id;
            user.name = cleanName; 
        } else {
            // New user
            const isAdmin = gameState.users.length === 0;
            user = { persistentId, socketId: socket.id, name: cleanName, vote: null, isAdmin };
            gameState.users.push(user);
        }

        io.emit('update', gameState);
    });

    // Handle Vote
    socket.on('vote', (value) => {
        if (!ESTIMATION_VALUES.includes(value)) {
            console.log(`Blocked unauthorized vote: ${value}`);
            return;
        }
        
        const user = gameState.users.find(u => u.socketId === socket.id);

        if (user) {
            user.vote = value;
            io.emit('update', gameState);
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', () => {
        const user = gameState.users.find(u => u.socketId === socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = true;
            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reveal attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    // Handle New Session (Admin only)
    socket.on('reset', () => {
        const user = gameState.users.find(u => u.socketId === socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = false;
            gameState.users.forEach(u => u.vote = null); // Reset votes
            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reset attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected temporarily:', socket.id);
    });


    // Handle Emoji Reactions
    socket.on('reaction', (data) => {
        // Setup minimal state
        if (!reactionLocks.has(socket.id)) {
            reactionLocks.set(socket.id, { isLocked: false, spamCount: 0 });
        }
        
        const lock = reactionLocks.get(socket.id);

        // THE LOCK
        if (lock.isLocked) {
            lock.spamCount++; 
            
            if (lock.spamCount > 20) {
                console.error(`Kicking spammer: ${socket.id}`);
                socket.emit('kicked', 'I kindly ask you to stop spamming my app. Best, Kate');

                // Disconnect with a tiny delay to ensure the message is sent
                setTimeout(() => {
                    socket.disconnect(true);
                }, 50);
            }
            return;
        }    

        // LOCK & BROADCAST
        lock.isLocked = true;

        // Emoji Validation
        const emojiChar = typeof data === 'object' ? data.emoji : data;
        if (ALLOWED_EMOJIS.includes(emojiChar)) {
            io.emit('reaction', data);
        } else {
        console.log(`Blocked unauthorized emoji: '${emojiChar}'`);
        }

        // 4. THE UNLOCK TIMER
        setTimeout(() => {
            lock.isLocked = false;
            // Reset spamCount after a successful wait
            lock.spamCount = 0; 
        }, SECURITY.REACTION_LOCK_TIMEOUT_MS); 
    });
});

server.listen(PORT, () => {
    console.log(`Poker planning running on ${PORT}`);
});