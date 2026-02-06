const { JSONFilePreset } = require('lowdb/node');

const defaultData = { 
    gameState: { 
        users: [], 
        revealed: false 
    } 
};

async function getDatabase() {
    const db = await JSONFilePreset('db.json', defaultData);
    return db;
}

module.exports = { getDatabase };