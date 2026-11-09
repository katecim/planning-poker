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

        const [user] = this.users.splice(index, 1);
        if (user.isAdmin && this.users.length > 0) {
            this.users[0].isAdmin = true;
        }

        return user;
    }

    toPublicState() {
        return {
            users: this.users.map(({ id, name, vote, isAdmin, isOnline }) => ({
                id, name, vote, isAdmin, isOnline
            })),
            revealed: this.revealed
        };
    }
}

module.exports = new GameState();