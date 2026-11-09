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

    toPublicState() {
        return {
            users: this.users.map(({ id, name, vote, isAdmin }) => ({ id, name, vote, isAdmin })),
            revealed: this.revealed
        };
    }
}

module.exports = new GameState();