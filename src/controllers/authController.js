const authService = require('../services/authService');
const logger = require('../utils/logger');

class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, name } = req.body;

            const result = await authService.register({ email, password, name });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    token: result.token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    token: result.token
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            // User is available from authentication middleware
            res.status(200).json({
                success: true,
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();