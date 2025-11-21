import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      // tells Prisma to read DATABASE_URL from the environment at migrate time
      url: { env: 'DATABASE_URL' },
    },
  },
});
