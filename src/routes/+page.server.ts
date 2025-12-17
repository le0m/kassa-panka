import { db, type TagEntity } from '$lib/server/db';
import { type SoundWithTags, type SceneWithSounds } from '$lib/server/db';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database with their tags, optionally filtered by search query
 */
export const load: PageServerLoad = async ({ url }) => {
	const searchQuery = url.searchParams.get('q')?.trim();

	const allSounds: SoundWithTags[] = await db.query.sounds.findMany({
		where: {
			deletedAt: { isNull: true },
			...(searchQuery
				? {
						OR: [
							{ name: { like: `%${searchQuery}%` } },
							{ tags: { name: { like: `%${searchQuery}%` } } }
						]
					}
				: {})
		},
		orderBy: { updatedAt: 'desc' },
		with: { tags: true }
	});

	// Fetch all non-deleted scenes
	const allScenes: SceneWithSounds[] = await db.query.scenes.findMany({
		where: { deletedAt: { isNull: true } },
		orderBy: { updatedAt: 'desc' },
		with: { sounds: { where: { deletedAt: { isNull: true } }, with: { tags: true } } }
	});

	// Fetch all tags
	const allTags: TagEntity[] = await db.query.tags.findMany({ orderBy: { name: 'asc' } });

	return {
		sounds: allSounds,
		scenes: allScenes,
		tags: allTags
	};
};
