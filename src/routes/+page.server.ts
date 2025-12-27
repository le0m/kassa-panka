import {
	db,
	type CategoryEntity,
	type GenreEntity,
	type SceneWithSoundsFull,
	type SoundFull,
	type TagEntity
} from '$lib/server/db';
import type { PageServerLoad } from './$types';

/**
 * Load all non-deleted sounds from the database with their tags, optionally filtered by search query
 */
export const load: PageServerLoad = async ({ url }) => {
	const admin = url.searchParams.has('admin');
	const searchQuery = url.searchParams.get('q')?.trim();
	const categoryQuery = url.searchParams.get('cat')?.trim();
	const genreQuery = url.searchParams.get('gen')?.trim();
	const where: any = { deletedAt: { isNull: true } };

	if (searchQuery) {
		where.OR ??= [];
		where.OR.push(
			...searchQuery
				.split(' ')
				.flatMap((term) => [
					{ name: { like: `%${term}%` } },
					{ tags: { name: { like: `%${term}%` } } }
				])
		);
	}

	if (categoryQuery) {
		where.categories = { id: categoryQuery };
	}

	if (genreQuery) {
		where.genres = { id: genreQuery };
	}

	const allSounds: SoundFull[] = await db.query.sounds.findMany({
		where,
		orderBy: { name: 'asc' },
		with: { tags: true, categories: true, genres: true },
		limit: 50
	});

	// Fetch all non-deleted scenes
	const allScenesFull: SceneWithSoundsFull[] = await db.query.scenes.findMany({
		where: { deletedAt: { isNull: true } },
		with: {
			sceneSounds: {
				where: { sound: { deletedAt: { isNull: true } } },
				orderBy: { position: 'asc' },
				with: { sound: { with: { tags: true, categories: true, genres: true } } }
			}
		}
	});

	// Fetch all tags
	const allTags: TagEntity[] = await db.query.tags.findMany({ orderBy: { name: 'asc' } });

	// Fetch all categories
	const allCategories: CategoryEntity[] = await db.query.categories.findMany({
		orderBy: { name: 'asc' }
	});

	// Fetch all genres
	const allGenres: GenreEntity[] = await db.query.genres.findMany({ orderBy: { name: 'asc' } });

	return {
		admin,
		sounds: allSounds,
		scenes: allScenesFull,
		tags: allTags,
		categories: allCategories,
		genres: allGenres
	};
};
