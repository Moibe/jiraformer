CREATE TABLE `generations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_key` text NOT NULL,
	`url` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL
);
