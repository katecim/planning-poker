const { ALLOWED_EMOJIS, SECURITY } = require('../constants');

// Memory store to track who is currently on cooldown (to prevent emoji spam)
const reactionLocks = new Map();

module.exports = (io, socket) => {
    socket.on('reaction', async (data) => {
        // Initialize or retrieve lock state
        if (!reactionLocks.has(socket.id)) {
            reactionLocks.set(socket.id, { isLocked: false });
        }
        
        const lock = reactionLocks.get(socket.id);

        // If the user is on cooldown, ignore the reaction (rate limiting)
        if (lock.isLocked) return;

        // Emoji validation
        const emojiChar = typeof data === 'object' ? data.emoji : data;
        
        if (ALLOWED_EMOJIS.includes(emojiChar)) {
            lock.isLocked = true;
            io.emit('reaction', data);
        } else {
            console.log(`Blocked unauthorized emoji: '${emojiChar}'`);
        }

        // Unlock after timeout
        setTimeout(() => {
            if (reactionLocks.has(socket.id)) {
                    reactionLocks.get(socket.id).isLocked = false;
                }
            }, SECURITY.REACTION_LOCK_TIMEOUT_MS);
    });
};