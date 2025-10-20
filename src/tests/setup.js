const path = require('path');

// Load test environment variables from .env.test file FIRST
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });


// Now import and create Prisma client after env vars are loaded
const getPrismaClient = require('../database/prisma');
const prisma = getPrismaClient();


// Test database connection before running tests
beforeAll(async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connection established for tests');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error.message);
        throw error;
    }
});

// Clean database before each test
beforeEach(async () => {
    try {
        // Delete in correct order to respect foreign key constraints
        await prisma.taskTag.deleteMany();
        await prisma.task.deleteMany();
        await prisma.tag.deleteMany();
        await prisma.user.deleteMany();
    } catch (error) {
        console.error('Error cleaning database:', error.message);
        // Don't throw here to avoid stopping all tests
    }
});

// Close database connection after all tests
afterAll(async () => {
    try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('Error disconnecting from database:', error.message);
    }
});

global.prisma = prisma;