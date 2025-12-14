import { randomUUID } from 'node:crypto';
import { relations } from 'drizzle-orm';
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

export const soundsRelations = relations(sounds, ({ many }) => ({
	soundScenes: many(scenesSounds),
	soundTags: many(soundsTags)
}));

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

export const scenesRelations = relations(scenes, ({ many }) => ({
	sceneSounds: many(scenesSounds)
}));

export const scenesSounds = sqliteTable(
	'scenes_sounds',
	{
		sceneId: text('scene_id', { length: 128 })
			.notNull()
			.references(() => scenes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		soundId: text('sound_id', { length: 128 })
			.notNull()
			.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.sceneId, table.soundId] })]
);

export const scenesSoundsRelations = relations(scenesSounds, ({ one }) => ({
	scene: one(scenes, {
		fields: [scenesSounds.sceneId],
		references: [scenes.id]
	}),
	sound: one(sounds, {
		fields: [scenesSounds.soundId],
		references: [sounds.id]
	})
}));

export const tags = sqliteTable('tags', {
	id: text('id', { length: 128 })
		.primaryKey()
		.$defaultFn(() => randomUUID()),
	name: text('name', { length: 64 }).notNull().unique(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const tagsRelations = relations(tags, ({ many }) => ({
	tagSounds: many(soundsTags)
}));

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

export const soundsTagsRelations = relations(soundsTags, ({ one }) => ({
	sound: one(sounds, {
		fields: [soundsTags.soundId],
		references: [sounds.id]
	}),
	tag: one(tags, {
		fields: [soundsTags.tagId],
		references: [tags.id]
	})
}));

export type SoundsTable = typeof sounds;
export type ScenesTable = typeof scenes;
export type ScenesSoundsTable = typeof scenesSounds;
export type TagsTable = typeof tags;
export type SoundsTagsTable = typeof soundsTags;

export type NewSoundEntity = typeof sounds.$inferInsert;
export type SoundEntity = typeof sounds.$inferSelect;
export type NewSceneEntity = typeof scenes.$inferInsert;
export type SceneEntity = typeof scenes.$inferSelect;
export type NewSceneSoundEntity = typeof scenesSounds.$inferInsert;
export type SceneSoundEntity = typeof scenesSounds.$inferSelect;
export type NewTagEntity = typeof tags.$inferInsert;
export type TagEntity = typeof tags.$inferSelect;
export type NewSoundTagEntity = typeof soundsTags.$inferInsert;
export type SoundTagEntity = typeof soundsTags.$inferSelect;
