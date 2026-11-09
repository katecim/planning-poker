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

    ensureOnlineAdmin() {
        if (this.users.some(user => user.isAdmin)) return false;

        const nextAdmin = this.users.find(user => user.isOnline);
        if (!nextAdmin) return false;

        nextAdmin.isAdmin = true;
        return true;
    }

    removeUserById(id) {
        const index = this.users.findIndex(user => user.id === id);
        if (index === -1) return null;

        const [user] = this.users.splice(index, 1);
        if (user.isAdmin) this.ensureOnlineAdmin();

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