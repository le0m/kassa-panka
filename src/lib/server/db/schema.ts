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
	soundPlaylists: many(playlistsSounds),
	soundTags: many(soundsTags)
}));

export const playlists = sqliteTable('playlists', {
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

export const playlistsRelations = relations(playlists, ({ many }) => ({
	playlistSounds: many(playlistsSounds)
}));

export const playlistsSounds = sqliteTable(
	'playlists_sounds',
	{
		playlistId: text('playlist_id', { length: 128 })
			.notNull()
			.references(() => playlists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		soundId: text('sound_id', { length: 128 })
			.notNull()
			.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.playlistId, table.soundId] })]
);

export const playlistsSoundsRelations = relations(playlistsSounds, ({ one }) => ({
	playlist: one(playlists, {
		fields: [playlistsSounds.playlistId],
		references: [playlists.id]
	}),
	sound: one(sounds, {
		fields: [playlistsSounds.soundId],
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
export type PlaylistsTable = typeof playlists;
export type PlaylistsSoundsTable = typeof playlistsSounds;
export type TagsTable = typeof tags;
export type SoundsTagsTable = typeof soundsTags;

export type NewSoundEntity = typeof sounds.$inferInsert;
export type SoundEntity = typeof sounds.$inferSelect;
export type NewPlaylistEntity = typeof playlists.$inferInsert;
export type PlaylistEntity = typeof playlists.$inferSelect;
export type NewPlaylistSoundEntity = typeof playlistsSounds.$inferInsert;
export type PlaylistSoundEntity = typeof playlistsSounds.$inferSelect;
export type NewTagEntity = typeof tags.$inferInsert;
export type TagEntity = typeof tags.$inferSelect;
export type NewSoundTagEntity = typeof soundsTags.$inferInsert;
export type SoundTagEntity = typeof soundsTags.$inferSelect;
