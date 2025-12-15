import { db } from '$lib/server/db';
import { sounds, soundsTags, tags, scenes, scenesSounds } from '$lib/server/db/schema';
import { asc, desc, isNull, eq, like, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database with their tags, optionally filtered by search query
 */
export const load: PageServerLoad = async ({ url }) => {
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

	// Fetch all non-deleted scenes
	const allScenes = await db
		.select()
		.from(scenes)
		.where(isNull(scenes.deletedAt))
		.orderBy(desc(scenes.createdAt));

	// Fetch linked sounds for each scene
	const scenesWithSounds = await Promise.all(
		allScenes.map(async (scene) => {
			const linkedSounds = await db
				.select({
					id: sounds.id,
					name: sounds.name,
					description: sounds.description,
					fileName: sounds.fileName,
					fileSize: sounds.fileSize,
					mediaType: sounds.mediaType,
					createdAt: sounds.createdAt
				})
				.from(sounds)
				.innerJoin(scenesSounds, eq(sounds.id, scenesSounds.soundId))
				.where(and(eq(scenesSounds.sceneId, scene.id), isNull(sounds.deletedAt)))
				.orderBy(asc(sounds.name));

			// Fetch tags for each linked sound
			const linkedSoundsWithTags = await Promise.all(
				linkedSounds.map(async (sound) => {
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
				...scene,
				sounds: linkedSoundsWithTags
			};
		})
	);

	// Fetch all tags
	const allTags = (await db.select({ name: tags.name }).from(tags).orderBy(asc(tags.name))).map(
		(tag) => tag.name
	);

	return {
		sounds: soundsWithTags,
		scenes: scenesWithSounds,
		tags: allTags
	};
};
