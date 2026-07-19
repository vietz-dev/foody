import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';
import { PrismaClient } from './generated/prisma/client.js';

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL ?? 'file:./foody.db' });

export const prisma = new PrismaClient({ adapter });
