const authService = require('../services/authService');
const { PrismaClient } = require('../generated/prisma');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    //Get token from header 
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
    }

    //Extract token (format: Bearer <token>)
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token 
    const decoded = authService.verifyToken(token);

    // Get user from database 
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    logger.warn(`Autentication failed: ${error.message}`);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticate };