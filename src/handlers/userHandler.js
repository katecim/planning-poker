const crypto = require('node:crypto');
const { SECURITY } = require('../constants');

const COOKIE_NAME = 'planning_poker_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

const getTokenFromCookie = cookieHeader => {
    const cookie = (cookieHeader || '').split(';').map(value => value.trim())
        .find(value => value.startsWith(`${COOKIE_NAME}=`));

    return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
};

const getUserFromToken = (gameState, token) => {
    if (!token) return null;

    const tokenHash = hashToken(token);
    return gameState.users.find(user =>
        user.sessionTokenHash === tokenHash && user.sessionExpiresAt > Date.now()
    ) || null;
};

const cleanName = name => {
    const clean = (typeof name === 'string' ? name : '')
        .replace(SECURITY.NAME_SANITIZATION_REGEX, '').trim();
    return clean.substring(0, SECURITY.MAX_NAME_LENGTH) || 'Anonymous Gopher';
};

const cookieOptions = req => ({
    httpOnly: true,
    secure: req.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS
});

module.exports = (app, io, gameState, gameService, presenceManager) => {
    io.use((socket, next) => {
        const token = getTokenFromCookie(socket.handshake.headers.cookie);
        const user = getUserFromToken(gameState, token);

        if (!user) return next(new Error('Unauthorized'));

        socket.data.userId = user.id;
        next();
    });

    app.get('/api/session', (req, res) => {
        const token = getTokenFromCookie(req.headers.cookie);
        const user = getUserFromToken(gameState, token);

        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        res.json({ user: { id: user.id, name: user.name } });
    });

    app.post('/api/session', async (req, res) => {
        const now = Date.now();
        gameState.users = gameState.users.filter(user => user.sessionExpiresAt > now);

        const token = crypto.randomBytes(32).toString('base64url');
        const user = {
            id: crypto.randomUUID(),
            sessionTokenHash: hashToken(token),
            sessionExpiresAt: now + SESSION_TTL_MS,
            name: cleanName(req.body?.name),
            vote: null,
            isOnline: false
        };

        gameState.users.push(user);
        await gameService.saveAndBroadcast();

        res.cookie(COOKIE_NAME, token, cookieOptions(req));
        res.status(201).json({ user: { id: user.id, name: user.name } });
    });

    app.delete('/api/session', async (req, res) => {
        const token = getTokenFromCookie(req.headers.cookie);
        const user = getUserFromToken(gameState, token);

        if (user) {
            presenceManager.cancelDisconnectCleanup(user.id);
            gameState.removeUserById(user.id);
            io.in(`user:${user.id}`).disconnectSockets(true);
            await gameService.saveAndBroadcast();
        }

        res.clearCookie(COOKIE_NAME, cookieOptions(req));
        res.sendStatus(204);
    });
};