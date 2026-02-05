const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const ALLOWED_EMOJIS = ['🎉', '💯', '🙅‍♀️', '☕'];

const reactionLocks = new Map();

// Game State
let gameState = {
    users: [], // { persistentId: 'uuid', socketId: 'sid', name: 'User', vote: null, isAdmin: boolean }
    revealed: false
};

io.on('connection', (socket) => {
    // Handle User Join (Modified for Persistence)
    socket.on('join', ({ name, persistentId }) => {
        // Security check: Sanitize name input to prevent XSS and limit length
        let cleanName = name.replace(/<[^>]*>?/gm, '').trim().substring(0, 20);
        if (!cleanName) cleanName = "Anonymous Gopher";

        // Check if this user already exists in the session
        let user = gameState.users.find(u => u.persistentId === persistentId);

        if (user) {
            // Reconnecting user: Update their name and current socket ID
            user.socketId = socket.id;
            user.name = cleanName; 
        } else {
            // New user: Check if they are the first ever to join
            const isAdmin = gameState.users.length === 0;
            user = { persistentId, socketId: socket.id, name: cleanName, vote: null, isAdmin };
            gameState.users.push(user);
        }

        io.emit('update', gameState);
    });

    // Update other handlers to use persistentId or find by socket.id
    socket.on('vote', (value) => {
        const validCards = [1, 2, 3, 5, 8, 13, '🦫'];
        if (!validCards.includes(value)) {
            console.log(`Blocked illegal vote: ${value}`);
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

                // 1. Send the warning signal
                socket.emit('kicked', 'I kindly ask you to stop spamming my app. Best, Kate');

                // 2. Disconnect with a tiny delay to ensure the message is sent
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
        }, 500); 
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Poker planning running on http://localhost:${PORT}`);
});