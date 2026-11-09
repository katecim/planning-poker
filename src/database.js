const { JSONFilePreset } = require('lowdb/node');

const defaultData = { users: [], revealed: false };

function normalizeDatabaseData(data) {
    const storedUsers = Array.isArray(data?.gameState?.users)
        ? data.gameState.users
        : data?.users;

    return {
        users: Array.isArray(storedUsers) ? storedUsers : [],
        revealed: false
    };
}

async function getDatabase() {
    const db = await JSONFilePreset('db.json', defaultData);
    return db;
}

module.exports = { getDatabase, normalizeDatabaseData };