import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { tags } from '$lib/server/db';
import { asc } from 'drizzle-orm';
import { logger } from '$lib/logger';

/**
 * GET endpoint to retrieve all tags
 * Returns a list of all tags in the database
 */
export const GET: RequestHandler = async () => {
	try {
		const allTags = await db.select().from(tags).orderBy(asc(tags.name));

		return json({ tags: allTags });
	} catch (error) {
		logger.error({ error }, 'Error fetching tags');
		return json({ error: 'Failed to fetch tags' }, { status: 500 });
	}
};
