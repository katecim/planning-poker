const gameState = require('../gameState');
const { ALLOWED_EMOJIS, SECURITY } = require('../constants');

const reactionLocks = new Map();

module.exports = (io, socket) => {
    socket.on('reaction', (data) => {
        // Initialize or retrieve lock state
        if (!reactionLocks.has(socket.id)) {
            reactionLocks.set(socket.id, { isLocked: false, spamCount: 0 });
        }
        
        const lock = reactionLocks.get(socket.id);

        // The Lock
        if (lock.isLocked) {
            lock.spamCount++; 
            
            if (lock.spamCount > SECURITY.MAX_SPAM_STRIKES) {
                console.error(`Kicking spammer: ${socket.id}`);
                
                const userIndex = gameState.users.findIndex(u => u.socketId === socket.id);
                if (userIndex !== -1) {
                    gameState.users.splice(userIndex, 1);
                }

                io.emit('update', gameState);
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
            lock.isLocked = false;
            lock.spamCount = 0; 
        }, SECURITY.REACTION_LOCK_TIMEOUT_MS); 
    });

    // Cleanup memory when the socket is closed
    socket.on('disconnect', () => {
        reactionLocks.delete(socket.id);
    });
};