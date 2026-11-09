const { ESTIMATION_VALUES } = require('../constants');

module.exports = (socket, gameState, gameService) => {
    // Handle Vote
    socket.on('vote', async (value) => {
        if (!ESTIMATION_VALUES.includes(value)) {
            console.log(`Blocked unauthorized vote: ${value}`);
            return;
        }
        
        const user = gameState.findUserById(socket.data.userId);
        
        if (user) {
            user.vote = value;
            await gameService.saveAndBroadcast();
        }
    });

    // Handle Reveal (Admin only)
    socket.on('reveal', async () => {
        const user = gameState.findUserById(socket.data.userId);

        if (user && user.isAdmin) {
            gameState.revealed = true;
            
            await gameService.saveAndBroadcast();
        } else {
        console.log(`Blocked unauthorized reveal attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });

    // Handle Background Change (Admin only)
    socket.on('change_bg', (bgType) => {
        const user = gameState.findUserById(socket.data.userId);
        if (user && user.isAdmin) {
            gameState.currentBg = bgType;
            gameService.broadcastBackground(bgType);
        }
    });

    // Handle New Session (Admin only)
    socket.on('reset', async () => {
        const user = gameState.findUserById(socket.data.userId);

        if (user && user.isAdmin) {
            gameState.reset();
            await gameService.saveAndBroadcast();
        } else {
        console.log(`Blocked unauthorized reset attempt from: ${user ? user.name : 'Unknown'}`);
    }
    });
}