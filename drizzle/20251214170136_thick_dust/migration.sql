CREATE TABLE `sounds_tags` (
	`sound_id` text(128) NOT NULL,
	`tag_id` text(128) NOT NULL,
	PRIMARY KEY(`sound_id`, `tag_id`),
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text(128) PRIMARY KEY NOT NULL,
	`name` text(64) NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);