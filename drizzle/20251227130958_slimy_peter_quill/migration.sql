PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sounds` (
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
INSERT INTO `__new_sounds`(`id`, `name`, `description`, `file_name`, `file_size`, `duration`, `media_type`, `created_at`, `updated_at`, `deleted_at`) SELECT `id`, `name`, `description`, `file_name`, `file_size`, `duration`, `media_type`, `created_at`, `updated_at`, `deleted_at` FROM `sounds`;--> statement-breakpoint
DROP TABLE `sounds`;--> statement-breakpoint
ALTER TABLE `__new_sounds` RENAME TO `sounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;