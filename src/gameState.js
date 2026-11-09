class GameState {
    constructor() {
        this.users = [];
        this.revealed = false;
    }

    reset() {
        this.revealed = false;
        this.users.forEach(user => {
            user.vote = null;
        });
    }

    findUserById(id) {
        return this.users.find(user => user.id === id);
    }

    removeUserById(id) {
        const index = this.users.findIndex(user => user.id === id);
        if (index === -1) return null;

        return this.users.splice(index, 1)[0];
    }

    toPublicState() {
        return {
            users: this.users.map(({ id, name, vote, isOnline }) => ({
                id, name, vote, isOnline
            })),
            revealed: this.revealed
        };
    }
}

module.exports = new GameState();