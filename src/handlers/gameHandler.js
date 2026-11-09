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

    // Handle Reveal
    socket.on('reveal', async () => {
        const user = gameState.findUserById(socket.data.userId);
        if (!user) return;

        gameState.revealed = true;
        await gameService.saveAndBroadcast();
    });

    // Handle Background Change
    socket.on('change_bg', (bgType) => {
        const user = gameState.findUserById(socket.data.userId);
        if (!user) return;

        gameState.currentBg = bgType;
        gameService.broadcastBackground(bgType);
    });

    // Handle New Round
    socket.on('reset', async () => {
        const user = gameState.findUserById(socket.data.userId);
        if (!user) return;

        gameState.reset();
        await gameService.saveAndBroadcast();
    });
}