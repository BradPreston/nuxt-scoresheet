PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_game` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`game_type_id` integer NOT NULL,
	`completed` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_game_game_type_id_game_type_id_fk` FOREIGN KEY (`game_type_id`) REFERENCES `game_type`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_game`(`id`, `game_type_id`, `completed`, `created_at`, `updated_at`) SELECT `id`, `game_type_id`, `completed`, `created_at`, `updated_at` FROM `game`;--> statement-breakpoint
DROP TABLE `game`;--> statement-breakpoint
ALTER TABLE `__new_game` RENAME TO `game`;--> statement-breakpoint
PRAGMA foreign_keys=ON;