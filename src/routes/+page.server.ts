import {
	db,
	type SceneWithSoundsPositions,
	type SoundWithPosition,
	type TagEntity
} from '$lib/server/db';
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
	const allScenesFull: SceneWithSoundsPositions[] = await Promise.all(
		allScenes.map(async (scene) => ({
			...scene,
			sounds: (
				await db.query.scenesSounds.findMany({
					columns: {
						soundId: true,
						position: true
					},
					where: {
						sceneId: scene.id,
						soundId: { in: scene.sounds.map((s) => s.id) }
					}
				})
			)
				.reduce((sounds, sceSo) => {
					const idx = sounds.findIndex((s) => s.id === sceSo.soundId);
					if (idx === -1) {
						console.log(
							`Position of sound ${sceSo.soundId} in scene ${scene.id} not found, ignoring`
						);

						return sounds;
					}

					sounds[idx].position = sceSo.position;

					return sounds;
				}, scene.sounds as SoundWithPosition[])
				.sort((a, b) => a.position - b.position)
		}))
	);

	// Fetch all tags
	const allTags: TagEntity[] = await db.query.tags.findMany({ orderBy: { name: 'asc' } });

	return {
		sounds: allSounds,
		scenes: allScenesFull,
		tags: allTags
	};
};
