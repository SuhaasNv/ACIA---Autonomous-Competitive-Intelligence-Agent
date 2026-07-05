const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const db = require('./db.service');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

function signToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

async function register(email, password) {
    const existing = await db.getUserByEmail(email);
    if (existing) {
        throw new Error('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.createUser(email, passwordHash);
    const token = signToken(user);
    return { user: { id: user.id, email: user.email }, token };
}

async function login(email, password) {
    const user = await db.getUserByEmail(email);
    if (!user) {
        throw new Error('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        throw new Error('Invalid email or password.');
    }

    const token = signToken(user);
    return { user: { id: user.id, email: user.email }, token };
}

function verifyToken(token) {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return { id: payload.sub, email: payload.email };
}

module.exports = { register, login, verifyToken };
