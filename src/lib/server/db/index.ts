import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '$env/dynamic/private';
import { relations } from './relations';

export * from './schema';

if (!env.DATABASE_DSN) throw new Error('DATABASE_DSN is not set');

export const db = drizzle(env.DATABASE_DSN, { relations });
