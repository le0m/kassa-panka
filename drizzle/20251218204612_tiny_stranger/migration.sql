ALTER TABLE `scenes_sounds` ADD `id` text(128);--> statement-breakpoint
ALTER TABLE `scenes_sounds` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` text(128) PRIMARY KEY,
	`name` text(64) NOT NULL UNIQUE,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`(`id`, `name`, `created_at`) SELECT `id`, `name`, `created_at` FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scenes_sounds` (
	`id` text(128) PRIMARY KEY,
	`scene_id` text(128) NOT NULL,
	`sound_id` text(128) NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	CONSTRAINT `fk_scenes_sounds_scene_id_scenes_id_fk` FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_scenes_sounds_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_scenes_sounds`(`scene_id`, `sound_id`) SELECT `scene_id`, `sound_id` FROM `scenes_sounds`;--> statement-breakpoint
DROP TABLE `scenes_sounds`;--> statement-breakpoint
ALTER TABLE `__new_scenes_sounds` RENAME TO `scenes_sounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sounds_tags` (
	`sound_id` text(128) NOT NULL,
	`tag_id` text(128) NOT NULL,
	CONSTRAINT `sounds_tags_sound_id_tag_id_pk` PRIMARY KEY(`sound_id`, `tag_id`),
	CONSTRAINT `fk_sounds_tags_sound_id_sounds_id_fk` FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_sounds_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_sounds_tags`(`sound_id`, `tag_id`) SELECT `sound_id`, `tag_id` FROM `sounds_tags`;--> statement-breakpoint
DROP TABLE `sounds_tags`;--> statement-breakpoint
ALTER TABLE `__new_sounds_tags` RENAME TO `sounds_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scenes` (
	`id` text(128) PRIMARY KEY,
	`name` text(128) NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_scenes`(`id`, `name`, `description`, `created_at`, `updated_at`, `deleted_at`) SELECT `id`, `name`, `description`, `created_at`, `updated_at`, `deleted_at` FROM `scenes`;--> statement-breakpoint
DROP TABLE `scenes`;--> statement-breakpoint
ALTER TABLE `__new_scenes` RENAME TO `scenes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sounds` (
	`id` text(128) PRIMARY KEY,
	`name` text(128) NOT NULL,
	`description` text,
	`file_name` text(128) NOT NULL,
	`file_size` integer NOT NULL,
	`media_type` text(64) NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_sounds`(`id`, `name`, `description`, `file_name`, `file_size`, `media_type`, `created_at`, `updated_at`, `deleted_at`) SELECT `id`, `name`, `description`, `file_name`, `file_size`, `media_type`, `created_at`, `updated_at`, `deleted_at` FROM `sounds`;--> statement-breakpoint
DROP TABLE `sounds`;--> statement-breakpoint
ALTER TABLE `__new_sounds` RENAME TO `sounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `tags_name_unique`;