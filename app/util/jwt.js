const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

module.exports = {
    generateJWT: async function (payload) {
        const expTime = 365 * 24 * 60 * 60; ;
        const token = await jwt.sign(payload, secretKey, { expiresIn: '365d' });
        return token;
    },
}