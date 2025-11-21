// Single Prisma client (named export)
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

process.on('beforeExit', async () => {
  try { await prisma.$disconnect(); } catch { /* ignore */ }
});
