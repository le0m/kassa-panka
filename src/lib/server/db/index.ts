import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '$env/dynamic/private';
import { relations } from './relations';

export * from './schema';

if (!env.DATABASE_PATH) {
	throw new Error('DATABASE_PATH is not set');
}

export const db = drizzle(env.DATABASE_PATH, { relations });
