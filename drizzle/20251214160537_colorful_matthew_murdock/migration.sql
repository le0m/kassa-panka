CREATE TABLE `playlists` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `playlists_sounds` (
	`playlist_id` text(128) NOT NULL,
	`sound_id` text(128) NOT NULL,
	PRIMARY KEY(`playlist_id`, `sound_id`),
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sounds` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`description` text,
	`file_name` text(128) NOT NULL,
	`file_size` integer NOT NULL,
	`media_type` text(64) NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
