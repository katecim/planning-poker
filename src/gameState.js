class GameState {
    constructor() {
        this.users = []; // { persistentId: 'uuid', socketId: 'sid', name: 'User', vote: null, isAdmin: boolean }
        this.revealed = false;
    }

    reset() {
        this.revealed = false;
        this.users.forEach(user => {
            user.vote = null;
        });
    }

    findUserBySocketId(id) {
        return this.users.find(u => u.socketId === id || u.persistentId === id);
    }

}

module.exports = new GameState();