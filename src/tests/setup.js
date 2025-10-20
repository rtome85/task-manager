const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

// Clean database before each test
beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.taskTag.deleteMany();
});

// Close database connection after all tests
afterAll(async () => {
    await prisma.$disconnect();
});

global.prisma = prisma;