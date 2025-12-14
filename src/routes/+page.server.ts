import { db } from '$lib/server/db';
import { sounds, soundsTags, tags } from '$lib/server/db/schema';
import { desc, isNull, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database with their tags
 */
export const load: PageServerLoad = async () => {
	const allSounds = await db
		.select()
		.from(sounds)
		.where(isNull(sounds.deletedAt))
		.orderBy(desc(sounds.createdAt));

	// Fetch tags for each sound
	const soundsWithTags = await Promise.all(
		allSounds.map(async (sound) => {
			const soundTags = await db
				.select({ name: tags.name })
				.from(soundsTags)
				.innerJoin(tags, eq(soundsTags.tagId, tags.id))
				.where(eq(soundsTags.soundId, sound.id));

			return {
				...sound,
				tags: soundTags.map((t) => t.name)
			};
		})
	);

	return {
		sounds: soundsWithTags
	};
};
