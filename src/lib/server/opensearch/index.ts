import { env } from '$env/dynamic/private';
import { Client, type Types } from '@opensearch-project/opensearch';
import { isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import { logger } from '$lib/logger';

const INDEX_NAME = 'kassa-panka';
// Note: to update the mappings, recreating the index may be required depending on the changes
const MAPPINGS: Record<string, Types.Common_Mapping.Property> = {
	name: { type: 'text' },
	tags: { type: 'keyword' },
	categories: { type: 'keyword' },
	genres: { type: 'keyword' }
};

export const opensearch = env.OPENSEARCH_URL ? new Client({ node: env.OPENSEARCH_URL }) : undefined;

export type SearchOptions = {
	query?: string;
	category?: string;
	genre?: string;
};

/**
 * Creates the index. If forced and the index exists, it is deleted before.
 */
export const createIndex = opensearch
	? async (force = false) => {
			const exists = await opensearch.indices.exists({ index: INDEX_NAME });

			if (exists.body) {
				if (!force) {
					logger.debug('OpenSearch index already exists');

					return;
				}

				await opensearch.indices.delete({ index: INDEX_NAME });
				logger.info('Deleted OpenSearch index');
			}

			await opensearch.indices.create({
				index: INDEX_NAME,
				body: {
					mappings: { properties: MAPPINGS }
				}
			});
			logger.info('Created OpenSearch index');
		}
	: undefined;

/**
 * Index a sound, updating it if already indexed or creating it otherwise.
 */
export const indexSound = opensearch
	? async (sound: schema.SoundFull) => {
			const res = await opensearch.index({
				index: INDEX_NAME,
				id: sound.id,
				body: {
					id: sound.id,
					name: sound.name,
					tags: sound.tags.map((tag) => tag.name).sort(),
					categories: sound.categories.map((cat) => cat.name),
					genres: sound.genres.map((gen) => gen.name)
				}
			});
			logger.debug({ ...res.body }, 'Indexed sound');
		}
	: undefined;

/**
 * Remove a sound from the index.
 */
export const removeSound = opensearch
	? async (soundId: string) => {
			const res = await opensearch.delete({
				index: INDEX_NAME,
				id: soundId
			});
			logger.debug({ ...res.body }, 'Removed sound');
		}
	: undefined;

/**
 * Index all sounds from database.
 */
export const indexSounds = opensearch
	? async function* (perPage = 50) {
			const total = await db.$count(schema.sounds, isNull(schema.sounds.deletedAt));
			const pages = Math.ceil(total / perPage);
			let page = 1;
			const current = { success: 0, fail: 0 };

			while (page <= pages) {
				// Paginate sounds
				const sounds = await db.query.sounds.findMany({
					where: { deletedAt: { isNull: true } },
					with: { tags: true, categories: true, genres: true },
					orderBy: { id: 'asc' },
					limit: perPage,
					offset: (page - 1) * perPage
				});
				page++;

				if (!sounds.length) {
					break;
				}

				// Bulk index fetched sounds
				const res = await opensearch.helpers.bulk({
					datasource: sounds,
					onDocument(doc) {
						return [
							{ index: { _index: INDEX_NAME, _id: doc.id } },
							{
								id: doc.id,
								name: doc.name,
								tags: doc.tags.map((tag) => tag.name).sort(),
								categories: doc.categories.map((cat) => cat.name),
								genres: doc.genres.map((gen) => gen.name)
							}
						];
					}
				});
				current.success += res.successful;
				current.fail += res.failed;

				// Yield current progress
				yield { total, current };
			}

			logger.info({ total, current }, 'Finished indexing sounds');
		}
	: undefined;

/**
 * Search sounds.
 */
export const searchSound = opensearch
	? async (options: SearchOptions, limit = 50) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const body: any = { size: limit };

			if (options.query) {
				body.query ??= {};
				body.query.bool ??= {};
				body.query.bool.should ??= [];
				body.query.bool.should.push({
					multi_match: {
						query: options.query,
						fields: ['name^5', 'tags']
					}
				});
			}

			if (options.category) {
				body.query ??= {};
				body.query.bool ??= {};
				body.query.bool.must ??= [];
				body.query.bool.must.push({ term: { categories: { value: options.category } } });
			}

			if (options.genre) {
				body.query ??= {};
				body.query.bool ??= {};
				body.query.bool.must ??= [];
				body.query.bool.must.push({ term: { genres: { value: options.genre } } });
			}

			const res = await opensearch.search({ index: INDEX_NAME, body });
			const hits =
				typeof res.body.hits.total === 'number'
					? res.body.hits.total
					: res.body.hits.total === undefined
						? 0
						: res.body.hits.total.value;
			logger.debug(logger.level === 'trace' ? body : options, `Found ${hits} results`);

			return res.body.hits.hits;
		}
	: undefined;

if (createIndex) {
	logger.info('Using OpenSearch');
	await createIndex();
}
