ALTER TABLE `playlists` RENAME TO `scenes`;--> statement-breakpoint
ALTER TABLE `playlists_sounds` RENAME TO `scenes_sounds`;--> statement-breakpoint
ALTER TABLE `scenes_sounds` RENAME COLUMN "playlist_id" TO "scene_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scenes_sounds` (
	`scene_id` text(128) NOT NULL,
	`sound_id` text(128) NOT NULL,
	PRIMARY KEY(`scene_id`, `sound_id`),
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_scenes_sounds`("scene_id", "sound_id") SELECT "scene_id", "sound_id" FROM `scenes_sounds`;--> statement-breakpoint
DROP TABLE `scenes_sounds`;--> statement-breakpoint
ALTER TABLE `__new_scenes_sounds` RENAME TO `scenes_sounds`;--> statement-breakpoint
PRAGMA foreign_keys=ON;