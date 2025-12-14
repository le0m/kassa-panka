import { db } from '$lib/server/db';
import { sounds } from '$lib/server/db/schema';
import { desc, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database
 */
export const load: PageServerLoad = async () => {
	const allSounds = await db
		.select()
		.from(sounds)
		.where(isNull(sounds.deletedAt))
		.orderBy(desc(sounds.createdAt));

	return {
		sounds: allSounds,
	};
};
