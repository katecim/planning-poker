const { ALLOWED_EMOJIS, ESTIMATION_VALUES, SECURITY } = require('../constants');

module.exports = (io, socket, gameState) => {    
    // Handle User Join
    socket.on('join', ({ name, persistentId }) => {
        // Send current deck/emojis to client immediately
        socket.emit('init_constants', { 
            deck: ESTIMATION_VALUES,
            emojis: ALLOWED_EMOJIS
        });

        // Sanitize name
        let cleanName = name.replace(SECURITY.NAME_SANITIZATION_REGEX, '')
                            .trim()
                            .substring(0, SECURITY.MAX_NAME_LENGTH);
        
        if (!cleanName) cleanName = "Anonymous Gopher";

        let user = gameState.users.find(u => u.persistentId === persistentId);

        if (user) {
            // Update existing user (Reconnection)
            user.socketId = socket.id;
            user.name = cleanName; 
        } else {
            // New user (First one is Admin)
            const isAdmin = gameState.users.length === 0;
            user = { persistentId, socketId: socket.id, name: cleanName, vote: null, isAdmin };
            gameState.users.push(user);
        }

        io.emit('update', gameState);
    });
}