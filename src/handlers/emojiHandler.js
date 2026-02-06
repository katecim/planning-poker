const { ALLOWED_EMOJIS, SECURITY } = require('../constants');

const reactionLocks = new Map();

module.exports = (io, socket, gameState, db) => {
    socket.on('reaction', async (data) => {
        // Initialize or retrieve lock state
        if (!reactionLocks.has(socket.id)) {
            reactionLocks.set(socket.id, { isLocked: false, spamCount: 0 });
        }
        
        const lock = reactionLocks.get(socket.id);

        // The Lock
        if (lock.isLocked) {
            lock.spamCount++; 
            
            if (lock.spamCount > SECURITY.MAX_SPAM_STRIKES) {
                const user = gameState.findUserBySocketId(socket.id);

                if (user) {
                    console.error(`Kicking spammer: ${user.name} (${socket.id})`);
                
                gameState.users = gameState.users.filter(u => u.socketId !== socket.id);

                await db.write();

                io.emit('update', gameState);
                }

                socket.emit('kicked', 'I kindly ask you to stop spamming my app. Please re-login. -Kate');

                setTimeout(() => {
                    socket.disconnect(true);
                }, SECURITY.DISCONNECT_DELAY_MS);
            }
            return;
        }    

        lock.isLocked = true;

        // Data Type Validation
        const emojiChar = typeof data === 'object' ? data.emoji : data;
        
        if (ALLOWED_EMOJIS.includes(emojiChar)) {
            io.emit('reaction', data);
        } else {
            console.log(`Blocked unauthorized emoji: '${emojiChar}'`);
        }

        // Unlock after timeout
        setTimeout(() => {
            if (reactionLocks.has(socket.id)) {
                const currentLock = reactionLocks.get(socket.id);
                currentLock.isLocked = false;
                currentLock.spamCount = 0; 
            }
        }, SECURITY.REACTION_LOCK_TIMEOUT_MS); 
    });

    // Cleanup memory when the socket is closed
    socket.on('disconnect', () => {
        reactionLocks.delete(socket.id);
    });
};