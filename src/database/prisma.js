const { PrismaClient } = require('../generated/prisma');

// Create a singleton Prisma client instance
let prisma;

function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
    }
    return prisma;
}

module.exports = getPrismaClient;
