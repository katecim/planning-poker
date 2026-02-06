require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { PORT} = require('./src/constants');

const registerUserHandler = require('./src/handlers/userHandler');
const registerGameHandler = require('./src/handlers/gameHandler');
const registerEmojiHandler = require('./src/handlers/emojiHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    
    registerUserHandler(io, socket);
    registerGameHandler(io, socket);
    registerEmojiHandler(io, socket);

    socket.on('disconnect', () => {
        console.log('User disconnected temporarily:', socket.id);
    });

});

server.listen(PORT, () => {
    console.log(`Poker planning running on ${PORT}`);
});