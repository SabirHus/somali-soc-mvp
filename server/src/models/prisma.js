import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // runtime URL here in 5.20+
});
