import {
	db,
	type CategoryEntity,
	type GenreEntity,
	type SceneFull,
	type SoundFull,
	type TagEntity
} from '$lib/server/db';
import { searchSound } from '$lib/server/opensearch';
import type { PageServerLoad } from './$types';

const ITEMS_PER_PAGE = 50;

/**
 * Load all non-deleted sounds from the database with their tags, optionally filtered by search query
 */
export const load: PageServerLoad = async ({ url }) => {
	const admin = url.searchParams.has('admin');
	const searchQuery = url.searchParams.get('q')?.trim();
	const categoryQuery = url.searchParams.get('cat')?.trim();
	const genreQuery = url.searchParams.get('gen')?.trim();
	let allSounds: SoundFull[] = [];

	if (searchSound) {
		// Search using opensearch scores
		const results = (
			await searchSound(
				{
					query: searchQuery,
					category: categoryQuery,
					genre: genreQuery
				},
				ITEMS_PER_PAGE
			)
		).reduce(
			(results, result) => results.set(result._id, parseFloat(result._score?.toString() ?? '0')),
			new Map<string, number>()
		);

		// Filter for IDs found with opensearch and manually sort by score
		allSounds = (
			await db.query.sounds.findMany({
				where: { deletedAt: { isNull: true }, id: { in: results.keys().toArray() } },
				with: { tags: true, categories: true, genres: true },
				limit: ITEMS_PER_PAGE
			})
		).sort((a, b) => (results.get(b.id) ?? 0) - (results.get(a.id) ?? 0));
	} else {
		// Search using SQL
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const where: any = { deletedAt: { isNull: true } };

		if (searchQuery) {
			if (!where?.id?.in || !where.id.in.length) {
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
		}

		if (categoryQuery) {
			where.categories = { id: categoryQuery };
		}

		if (genreQuery) {
			where.genres = { id: genreQuery };
		}

		allSounds = await db.query.sounds.findMany({
			where,
			orderBy: { name: 'asc' },
			with: { tags: true, categories: true, genres: true },
			limit: ITEMS_PER_PAGE
		});
	}

	// Fetch all non-deleted scenes
	const allScenesFull: SceneFull[] = await db.query.scenes.findMany({
		where: { deletedAt: { isNull: true } },
		with: {
			sceneSounds: {
				where: { sound: { deletedAt: { isNull: true } } },
				orderBy: { position: 'asc' },
				with: { sound: { with: { tags: true, categories: true, genres: true } } }
			}
		},
		orderBy: { updatedAt: 'desc' }
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
