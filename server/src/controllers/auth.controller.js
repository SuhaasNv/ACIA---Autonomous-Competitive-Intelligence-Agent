const authService = require('../services/auth.service');

async function registerHandler(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.register(email, password);
        return res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
}

async function loginHandler(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        if (error.message.includes('Invalid email or password')) {
            return res.status(401).json({ error: error.message });
        }
        next(error);
    }
}

async function meHandler(req, res) {
    return res.status(200).json({ status: 'success', data: { user: req.user } });
}

module.exports = { registerHandler, loginHandler, meHandler };
