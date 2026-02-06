const { ALLOWED_EMOJIS, SECURITY } = require('../constants');

const reactionLocks = new Map();

module.exports = (io, socket) => {
    socket.on('reaction', (data) => {
        // 1. Initialize or retrieve lock state
        if (!reactionLocks.has(socket.id)) {
            reactionLocks.set(socket.id, { isLocked: false, spamCount: 0 });
        }
        
        const lock = reactionLocks.get(socket.id);

        // 2. THE LOCK (Anti-Spam)
        if (lock.isLocked) {
            lock.spamCount++; 
            
            if (lock.spamCount > SECURITY.MAX_SPAM_STRIKES) {
                console.error(`Kicking spammer: ${socket.id}`);
                socket.emit('kicked', 'I kindly ask you to stop spamming my app. Best, Kate');

                setTimeout(() => {
                    socket.disconnect(true);
                }, SECURITY.DISCONNECT_DELAY_MS);
            }
            return; // Terminate if locked
        }    

        // 3. LOCK & BROADCAST
        lock.isLocked = true;

        // Data Type Validation
        const emojiChar = typeof data === 'object' ? data.emoji : data;
        
        if (ALLOWED_EMOJIS.includes(emojiChar)) {
            io.emit('reaction', data);
        } else {
            console.log(`Blocked unauthorized emoji: '${emojiChar}'`);
        }

        // 4. THE UNLOCK TIMER
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