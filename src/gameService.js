module.exports = ({ io, gameState, db }) => ({
    async saveAndBroadcast() {
        db.data = { users: gameState.users, revealed: gameState.revealed };
        await db.write();
        io.emit('update', gameState.toPublicState());
    },

    emitCurrentState(socket) {
        socket.emit('update', gameState.toPublicState());
    },

    broadcastBackground(bgType) {
        io.emit('bg_changed', bgType);
    }
});