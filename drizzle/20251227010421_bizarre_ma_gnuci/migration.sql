CREATE TABLE `categories` (
	`id` text(128) PRIMARY KEY,
	`name` text(64) NOT NULL UNIQUE,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `genres` (
	`id` text(128) PRIMARY KEY,
	`name` text(64) NOT NULL UNIQUE,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sounds_categories` (
	`sound_id` text(128) NOT NULL,
	`category_id` text(128) NOT NULL,
	CONSTRAINT `sounds_categories_pk` PRIMARY KEY(`sound_id`, `category_id`),
	CONSTRAINT `fk_sounds_categories_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sounds_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sounds_genres` (
	`sound_id` text(128) NOT NULL,
	`genre_id` text(128) NOT NULL,
	CONSTRAINT `sounds_genres_pk` PRIMARY KEY(`sound_id`, `genre_id`),
	CONSTRAINT `fk_sounds_genres_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sounds_genres_genre_id_genres_id_fk` FOREIGN KEY (`genre_id`) REFERENCES `genres`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sounds` (
	`id` text(128) PRIMARY KEY,
	`name` text(128) NOT NULL,
	`description` text,
	`type` text DEFAULT 'sfx' NOT NULL,
	`file_name` text(128) NOT NULL,
	`file_size` integer NOT NULL,
	`media_type` text(64) NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_sounds`(`id`, `name`, `description`, `type`, `file_name`, `file_size`, `media_type`, `created_at`, `updated_at`, `deleted_at`) SELECT `id`, `name`, `description`, `type`, `file_name`, `file_size`, `media_type`, `created_at`, `updated_at`, `deleted_at` FROM `sounds`;--> statement-breakpoint
DROP TABLE `sounds`;--> statement-breakpoint
ALTER TABLE `__new_sounds` RENAME TO `sounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;