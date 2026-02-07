const { SECURITY } = require('../constants');

module.exports = (io, socket, gameState, db) => {
   // Sanitize name
    const getCleanName = (name) => {
        const clean = (name || "").replace(SECURITY.NAME_SANITIZATION_REGEX, '').trim();
        return clean.substring(0, SECURITY.MAX_NAME_LENGTH) || "Anonymous Gopher";
    };
   
    // Save and alert everyone
    const broadcastUpdate = async () => {
        await db.write();
        io.emit('update', gameState);
    };
    
    
    // Handle User Join
    socket.on('join', async ({ name, persistentId }) => {
        let cleanName = getCleanName(name);

        let user = gameState.users.find(u => u.persistentId === persistentId);

        if (user) {
            // Update existing user (Reconnection)
            user.socketId = socket.id;
            user.name = cleanName;
        } else {
            // New user
            const duplicateCheck = gameState.users.find(u => u.socketId === socket.id);
            if (duplicateCheck) return;
            // First user is Admin
            const isAdmin = gameState.users.length === 0;
            user = { 
                persistentId, 
                socketId: socket.id, 
                name: cleanName, 
                vote: null, 
                isAdmin
            };
            gameState.users.push(user);
        }

        await broadcastUpdate();
    });

    socket.on('logout', async () => {
        // Find and remove the user
        const index = gameState.users.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            const removedUser = gameState.users.splice(index, 1)[0];

            // If the person leaving was the Admin, assign Admin to the next person in line
            if (removedUser.isAdmin && gameState.users.length > 0) {
                gameState.users[0].isAdmin = true;
            }

            await broadcastUpdate();
            }
    });
}