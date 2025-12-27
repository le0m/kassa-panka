import { db, type SceneWithSoundsFull, type TagEntity } from '$lib/server/db';
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
		with: { tags: true },
		limit: 50
	});

	// Fetch all non-deleted scenes
	const allScenesFull: SceneWithSoundsFull[] = await db.query.scenes.findMany({
		where: { deletedAt: { isNull: true } },
		with: {
			sceneSounds: {
				where: { sound: { deletedAt: { isNull: true } } },
				orderBy: { position: 'asc' },
				with: { sound: { with: { tags: true } } }
			}
		}
	});

	// Fetch all tags
	const allTags: TagEntity[] = await db.query.tags.findMany({ orderBy: { name: 'asc' } });

	return {
		sounds: allSounds,
		scenes: allScenesFull,
		tags: allTags
	};
};
