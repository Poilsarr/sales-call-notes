import { PrismaClient } from '@prisma/client';

const assembleDbUrl = () => {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT || '5432';

  if (user && password && host && name) {
    return `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=require`;
  }
  return process.env.DATABASE_URL;
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  process.env.DATABASE_URL = assembleDbUrl() || '';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
