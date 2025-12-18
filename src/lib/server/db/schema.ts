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
	position: integer('position').notNull().default(0)
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

export type SoundsTable = typeof sounds;
export type ScenesTable = typeof scenes;
export type ScenesSoundsTable = typeof scenesSounds;
export type TagsTable = typeof tags;
export type SoundsTagsTable = typeof soundsTags;

export type NewSoundEntity = typeof sounds.$inferInsert;
export type SoundEntity = typeof sounds.$inferSelect;
export type SoundWithTags = SoundEntity & { tags: TagEntity[] };
export type SoundWithPosition = SoundWithTags & { position: number };

export type NewSceneEntity = typeof scenes.$inferInsert;
export type SceneEntity = typeof scenes.$inferSelect;
export type SceneWithSounds = SceneEntity & { sounds: SoundWithTags[] };
export type SceneWithSoundsPositions = SceneEntity & { sounds: SoundWithPosition[] };

export type NewSceneSoundEntity = typeof scenesSounds.$inferInsert;
export type SceneSoundEntity = typeof scenesSounds.$inferSelect;
export type SceneSoundWithTags = SceneSoundEntity & { sound: SoundWithTags | null };

export type NewTagEntity = typeof tags.$inferInsert;
export type TagEntity = typeof tags.$inferSelect;

export type NewSoundTagEntity = typeof soundsTags.$inferInsert;
export type SoundTagEntity = typeof soundsTags.$inferSelect;
