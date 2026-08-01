CREATE TABLE `game` (
	`id` integer PRIMARY KEY,
	`game_type_id` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_game_game_type_id_game_type_id_fk` FOREIGN KEY (`game_type_id`) REFERENCES `game_type`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `game_type` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
