import * as Pino from 'pino';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';

const pino: typeof Pino.pino = typeof Pino === 'function' ? Pino : Pino.default;
export const logger: Pino.Logger = pino({
	transport: dev ? { target: 'pino-pretty' } : undefined,
	level: env.PUBLIC_LOG_LEVEL || (dev ? 'debug' : 'info')
});
