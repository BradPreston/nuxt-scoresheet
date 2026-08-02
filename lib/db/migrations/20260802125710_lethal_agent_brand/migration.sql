CREATE TABLE `score` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` integer NOT NULL,
	`round_id` integer NOT NULL,
	`score` integer NOT NULL,
	`phase` integer,
	`made_phase` integer,
	CONSTRAINT `fk_score_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_score_round_id_round_id_fk` FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON DELETE CASCADE
);
