const { ESTIMATION_VALUES } = require('../constants');

module.exports = (io, socket, gameState, db) => {
    // Handle Vote
    socket.on('vote', async (value) => {
        console.log(`--- Vote Attempt ---`);
        console.log(`Socket ID: ${socket.id}`);

        if (!ESTIMATION_VALUES.includes(value)) {
            console.log(`Blocked unauthorized vote: ${value}`);
            return;
        }
        
        const user = gameState.findUserBySocketId(socket.id);
        console.log(`User found: ${user ? user.name : 'NO USER FOUND'}`);

        if (user) {
            user.vote = value;

            await db.write();
            console.log(`Vote saved. Current DB users:`, gameState.users.length);

            io.emit('update', gameState);
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', async () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = true;

            await db.write();

            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reveal attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    // Handle New Session (Admin only)
    socket.on('reset', async () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.reset();

            await db.write();

            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reset attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });
}