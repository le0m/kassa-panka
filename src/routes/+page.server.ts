import { db } from '$lib/server/db';
import { sounds, soundsTags, tags } from '$lib/server/db/schema';
import { desc, isNull, eq, like, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database with their tags, optionally filtered by search query
 */
export const load: PageServerLoad = async ({ url }) => {
	console.log({ url: url.toString() });
	const searchQuery = url.searchParams.get('q')?.trim();

	let allSounds;

	if (searchQuery) {
		// Search using SQL LIKE for partial matching on sound name or tags
		const soundsMatchingName = await db
			.select()
			.from(sounds)
			.where(and(like(sounds.name, `%${searchQuery}%`), isNull(sounds.deletedAt)))
			.orderBy(desc(sounds.createdAt));

		// Find sounds that have matching tags
		const soundsWithMatchingTags = await db
			.select({
				id: sounds.id,
				name: sounds.name,
				description: sounds.description,
				fileName: sounds.fileName,
				fileSize: sounds.fileSize,
				mediaType: sounds.mediaType,
				createdAt: sounds.createdAt,
				deletedAt: sounds.deletedAt
			})
			.from(sounds)
			.innerJoin(soundsTags, eq(sounds.id, soundsTags.soundId))
			.innerJoin(tags, eq(soundsTags.tagId, tags.id))
			.where(and(like(tags.name, `%${searchQuery}%`), isNull(sounds.deletedAt)))
			.orderBy(desc(sounds.createdAt));

		// Combine and deduplicate results
		const soundMap = new Map();
		console.log(
			`Found ${soundsMatchingName.length} by name and ${soundsWithMatchingTags.length} by tag`
		);
		soundsMatchingName.forEach((sound) => soundMap.set(sound.id, sound));
		soundsWithMatchingTags.forEach((sound) => soundMap.set(sound.id, sound));
		allSounds = Array.from(soundMap.values()).sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		);
	} else {
		allSounds = await db
			.select()
			.from(sounds)
			.where(isNull(sounds.deletedAt))
			.orderBy(desc(sounds.createdAt));
	}

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
