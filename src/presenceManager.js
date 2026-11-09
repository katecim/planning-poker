module.exports = ({
    io,
    gameState,
    gameService,
    gracePeriodMs,
    scheduleTimeout = setTimeout,
    cancelTimeout = clearTimeout
}) => {
    const disconnectTimers = new Map();

    const cancelDisconnectCleanup = userId => {
        const timer = disconnectTimers.get(userId);
        if (timer) cancelTimeout(timer);
        disconnectTimers.delete(userId);
    };

    const removeAfterGracePeriod = async (userId, timer) => {
        if (disconnectTimers.get(userId) !== timer) return;

        const user = gameState.findUserById(userId);
        if (!user) {
            disconnectTimers.delete(userId);
            return;
        }

        const sockets = await io.in(`user:${userId}`).fetchSockets();
        if (disconnectTimers.get(userId) !== timer) return;

        if (sockets.length > 0) {
            disconnectTimers.delete(userId);
            user.isOnline = true;
            await gameService.saveAndBroadcast();
            return;
        }

        disconnectTimers.delete(userId);
        gameState.removeUserById(userId);
        await gameService.saveAndBroadcast();
    };

    const handleDisconnect = async userId => {
        const sockets = await io.in(`user:${userId}`).fetchSockets();
        if (sockets.length > 0) return;

        const user = gameState.findUserById(userId);
        if (!user || !user.isOnline) return;

        user.isOnline = false;
        cancelDisconnectCleanup(userId);

        let timer;
        timer = scheduleTimeout(
            () => removeAfterGracePeriod(userId, timer).catch(error => console.error(error)),
            gracePeriodMs
        );
        disconnectTimers.set(userId, timer);

        await gameService.saveAndBroadcast();
    };

    return {
        handleConnection(socket) {
            const userId = socket.data.userId;
            const user = gameState.findUserById(userId);
            if (!user) {
                socket.disconnect(true);
                return;
            }

            socket.join(`user:${userId}`);
            cancelDisconnectCleanup(userId);

            if (!user.isOnline) {
                user.isOnline = true;
                gameService.saveAndBroadcast().catch(error => console.error(error));
            }

            socket.on('disconnect', () => handleDisconnect(userId)
                .catch(error => console.error(error)));
        },

        cancelDisconnectCleanup
    };
};