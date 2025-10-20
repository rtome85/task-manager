const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getPrismaClient = require('../database/prisma');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

class AuthService {

    async register(userData) {
        const { email, password, name } = userData;
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Hash password with salt rounds of 12 for security
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user 
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });

            // Generate JWT token
            const token = this.generateToken(user.id);

            logger.info(`New user registered: ${email}`);
            return { user, token };

        } catch (error) {
            logger.error('Error registering user:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password 
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT token
            const token = this.generateToken(user.id);

            //Return user without password
            const { password: _, ...userWithoutPassword } = user;

            logger.info(`User logged in: ${email}`);

            return { user: userWithoutPassword, token };

        } catch (error) {
            logger.error('Error logging in user:', error);
            throw error;
        }
    }

    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '7d',
                issuer: 'task-manager-api',
                audience: 'task-manager-client'
            }
        );
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            logger.error('Invalid token:', error);
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = new AuthService();
