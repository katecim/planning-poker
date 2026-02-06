const gameState = require('../gameState');
const { ESTIMATION_VALUES } = require('../constants');

module.exports = (io, socket) => {
    // Handle Vote
    socket.on('vote', (value) => {
        if (!ESTIMATION_VALUES.includes(value)) {
            console.log(`Blocked unauthorized vote: ${value}`);
            return;
        }
        
        const user = gameState.findUserBySocketId(socket.id);

        if (user) {
            user.vote = value;
            io.emit('update', gameState);
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = true;
            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reveal attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    // Handle New Session (Admin only)
    socket.on('reset', () => {
        const user = gameState.findUserBySocketId(socket.id);

        if (user && user.isAdmin) {
            gameState.revealed = false;
            gameState.users.forEach(u => u.vote = null); // Reset votes
            io.emit('update', gameState);
        } else {
        console.log(`Blocked unauthorized reset attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });
}