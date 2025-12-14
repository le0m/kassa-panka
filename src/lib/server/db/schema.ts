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
	deletedAt: text('deleted_at'),
});

export const soundsRelations = relations(sounds, ({ many }) => ({
	soundPlaylists: many(playlistsSounds),
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
	deletedAt: text('deleted_at'),
});

export const playlistsRelations = relations(playlists, ({ many }) => ({
	playlistSounds: many(playlistsSounds),
}));

export const playlistsSounds = sqliteTable('playlists_sounds', {
	playlistId: text('playlist_id', { length: 128 })
		.notNull()
		.references(() => playlists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	soundId: text('sound_id', { length: 128 })
		.notNull()
		.references(() => sounds.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.playlistId, table.soundId] })]);

export const playlistsSoundsRelations = relations(playlistsSounds, ({ one }) => ({
	playlist: one(playlists, {
		fields: [playlistsSounds.playlistId],
		references: [playlists.id],
	}),
	sound: one(sounds, {
		fields: [playlistsSounds.soundId],
		references: [sounds.id],
	}),
}));

export type SoundsTable = typeof sounds;
export type PlaylistsTable = typeof playlists;
export type PlaylistsSoundsTable = typeof playlistsSounds;

export type NewSoundEntity = typeof sounds.$inferInsert;
export type SoundEntity = typeof sounds.$inferSelect;
export type NewPlaylistEntity = typeof playlists.$inferInsert;
export type PlaylistEntity = typeof playlists.$inferSelect;
export type NewPlaylistSoundEntity = typeof playlistsSounds.$inferInsert;
export type PlaylistSoundEntity = typeof playlistsSounds.$inferSelect;
