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

    findUserBySocketId(socketId) {
        let found = this.users.find(u => u.socketId === socketId);
        
        return found;
    }
}

module.exports = new GameState();