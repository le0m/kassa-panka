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
CREATE TABLE `scenes` (
	`id` text(128) PRIMARY KEY,
	`name` text(128) NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `scenes_sounds` (
	`id` text(128) PRIMARY KEY,
	`scene_id` text(128) NOT NULL,
	`sound_id` text(128) NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`loop` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_scenes_sounds_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_scenes_sounds_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sounds` (
	`id` text(128) PRIMARY KEY,
	`name` text(128) NOT NULL,
	`description` text,
	`file_name` text(128) NOT NULL,
	`file_size` integer NOT NULL,
	`duration` integer NOT NULL,
	`media_type` text(64) NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
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
CREATE TABLE `sounds_tags` (
	`sound_id` text(128) NOT NULL,
	`tag_id` text(128) NOT NULL,
	CONSTRAINT `sounds_tags_pk` PRIMARY KEY(`sound_id`, `tag_id`),
	CONSTRAINT `fk_sounds_tags_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sounds_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text(128) PRIMARY KEY,
	`name` text(64) NOT NULL UNIQUE,
	`created_at` text NOT NULL
);
