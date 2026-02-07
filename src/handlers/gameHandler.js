const { ESTIMATION_VALUES } = require('../constants');

module.exports = (io, socket, gameState, db) => {
    // Save and alert everyone    
    const broadcastUpdate = async () => {
        await db.write();
        io.emit('update', gameState);
    }
    
    
    // Handle Vote
    socket.on('vote', async (value) => {
        if (!ESTIMATION_VALUES.includes(value)) {
            console.log(`Blocked unauthorized vote: ${value}`);
            return;
        }
        
        const user = gameState.findUserBySocketId(socket.id);
        
        if (user) {
            user.vote = value;
            await broadcastUpdate();
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', async () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = true;
            await broadcastUpdate();
        } else {
        console.log(`Blocked unauthorized reveal attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    // Handle New Session (Admin only)
    socket.on('reset', async () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.reset();
            await broadcastUpdate();
        } else {
        console.log(`Blocked unauthorized reset attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });
}