module.exports = {
    PORT: process.env.PORT || 3000,
    
    ESTIMATION_VALUES: [0, 1, 2, 3, 5, 8, 13, '🦫'],

    ALLOWED_EMOJIS: ['🎉', '💯', '🙅‍♀️', '☕'],

    SECURITY: {
        MAX_NAME_LENGTH: 20,
        NAME_SANITIZATION_REGEX: /<[^>]*>?/gm,
        REACTION_LOCK_TIMEOUT_MS: 500,
        DISCONNECT_DELAY_MS: 50,
        MAX_SPAM_STRIKES: 20
    },


};