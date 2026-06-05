import { PrismaClient } from '@prisma/client';
import { getSecret } from './secrets';

const assembleDbUrl = () => {
  const user = getSecret('DB_USER');
  const password = getSecret('DB_PASSWORD');
  const host = getSecret('DB_HOST');
  const name = getSecret('DB_NAME');
  const port = getSecret('DB_PORT') || '5432';

  if (user && password && host && name) {
    return `postgresql://${user}:${password}@${host}:${port}/${name}?sslmode=require`;
  }
  return getSecret('DATABASE_URL');
};

if (getSecret('DB_USER') && getSecret('DB_PASSWORD')) {
  process.env.DATABASE_URL = assembleDbUrl() || '';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
