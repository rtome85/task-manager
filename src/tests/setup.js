const getPrismaClient = require('../database/prisma');

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.LOG_LEVEL = 'error';
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_LVywOhb3XF2G@ep-rough-wind-agfx5irm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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