const { ALLOWED_EMOJIS, ESTIMATION_VALUES, SECURITY } = require('../constants');

module.exports = (io, socket, gameState, db) => {    
    // Handle User Join
    socket.on('join', async ({ name, persistentId }) => {
        // Send current deck/emojis to client
        socket.emit('init_constants', { 
            deck: ESTIMATION_VALUES,
            emojis: ALLOWED_EMOJIS
        });

        const inputName = name || "";

        // Sanitize name
        let cleanName = inputName.replace(SECURITY.NAME_SANITIZATION_REGEX, '')
                            .trim()
                            .substring(0, SECURITY.MAX_NAME_LENGTH);
        
        if (!cleanName) cleanName = "Anonymous Gopher";

        let user = gameState.users.find(u => u.persistentId === persistentId);

        if (user) {
            // Update existing user (Reconnection)
            user.socketId = socket.id;
            user.name = cleanName;
            console.log(`✅ ID Synced: ${user.name} is now ${socket.id}`);
        } else {
            // New user (First one is Admin)
            const duplicateCheck = gameState.users.find(u => u.socketId === socket.id);
            if (duplicateCheck) return;
            
            const isAdmin = gameState.users.length === 0;
            user = { 
                persistentId, 
                socketId: socket.id, 
                name: cleanName, 
                vote: null, 
                isAdmin
            };
            gameState.users.push(user);
            console.log(`New user joined: ${cleanName}`);
        }

        await db.write();

        io.emit('update', gameState);
    });
}