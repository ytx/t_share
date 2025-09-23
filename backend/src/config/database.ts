import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client instance
let prisma: PrismaClient;

// Ensure only one Prisma Client instance exists
function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  return prisma;
}

export default getPrismaClient();