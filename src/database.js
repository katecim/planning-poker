const { JSONFilePreset } = require('lowdb/node');
const path = require('node:path');

const defaultData = { users: [], revealed: false };

async function getDatabase() {
    const dataDirectory = path.resolve(__dirname, '..', process.env.DATA_DIR || '.');
    const databasePath = path.join(dataDirectory, 'db.json');
    const db = await JSONFilePreset(databasePath, defaultData);
    return db;
}

module.exports = { getDatabase };