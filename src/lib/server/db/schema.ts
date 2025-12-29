import { randomUUID } from 'node:crypto';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sounds = sqliteTable('sounds', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 128 }).notNull(),
	description: text('description'),
	fileName: text('file_name', { length: 128 }).notNull(),
	fileSize: integer('file_size').notNull(),
	duration: integer('duration').notNull(),
	mediaType: text('media_type', { length: 64 }).notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
	deletedAt: text('deleted_at')
});

export const scenes = sqliteTable('scenes', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 128 }).notNull(),
	description: text('description'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text('updated_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
	deletedAt: text('deleted_at')
});

export const scenesSounds = sqliteTable('scenes_sounds', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	sceneId: text('scene_id', { length: 128 })
		.notNull()
		.references(() => scenes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	soundId: text('sound_id', { length: 128 })
		.notNull()
		.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	position: integer('position').notNull().default(0),
	loop: integer('loop', { mode: 'boolean' }).notNull().default(false)
});

export const tags = sqliteTable('tags', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 64 }).notNull().unique(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const soundsTags = sqliteTable(
	'sounds_tags',
	{
		soundId: text('sound_id', { length: 128 })
			.notNull()
			.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		tagId: text('tag_id', { length: 128 })
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.soundId, table.tagId] })]
);

export const categories = sqliteTable('categories', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 64 }).notNull().unique(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const soundsCategories = sqliteTable(
	'sounds_categories',
	{
		soundId: text('sound_id', { length: 128 })
			.notNull()
			.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		categoryId: text('category_id', { length: 128 })
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.soundId, table.categoryId] })]
);

export const genres = sqliteTable('genres', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 64 }).notNull().unique(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const soundsGenres = sqliteTable(
	'sounds_genres',
	{
		soundId: text('sound_id', { length: 128 })
			.notNull()
			.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		genreId: text('genre_id', { length: 128 })
			.notNull()
			.references(() => genres.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.soundId, table.genreId] })]
);

export type SoundsTable = typeof sounds;
export type ScenesTable = typeof scenes;
export type ScenesSoundsTable = typeof scenesSounds;
export type TagsTable = typeof tags;
export type CategoriesTable = typeof categories;
export type GenresTable = typeof genres;
export type SoundsTagsTable = typeof soundsTags;

export type NewSoundEntity = typeof sounds.$inferInsert;
export type SoundEntity = typeof sounds.$inferSelect;
export type SoundFull = SoundEntity & {
	tags: TagEntity[];
	categories: CategoryEntity[];
	genres: GenreEntity[];
};

export type NewSceneEntity = typeof scenes.$inferInsert;
export type SceneEntity = typeof scenes.$inferSelect;
export type SceneFull = SceneEntity & { sceneSounds: SceneSoundFull[] };

export type NewSceneSoundEntity = typeof scenesSounds.$inferInsert;
export type SceneSoundEntity = typeof scenesSounds.$inferSelect;
export type SceneSoundFull = SceneSoundEntity & { sound: SoundFull | null };

export type NewTagEntity = typeof tags.$inferInsert;
export type TagEntity = typeof tags.$inferSelect;

export type NewCategoryEntity = typeof categories.$inferInsert;
export type CategoryEntity = typeof categories.$inferSelect;

export type NewGenreEntity = typeof genres.$inferInsert;
export type GenreEntity = typeof genres.$inferSelect;

export type NewSoundTagEntity = typeof soundsTags.$inferInsert;
export type SoundTagEntity = typeof soundsTags.$inferSelect;
