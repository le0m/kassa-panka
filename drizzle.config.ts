import process from 'node:process';
import { loadEnv } from 'vite';
import { defineConfig } from 'drizzle-kit';

process.env = { ...process.env, ...loadEnv(process.env.NODE_ENV || 'development', './', '') };

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: process.env.DATABASE_URL! },
	verbose: true,
	strict: true
});
