CREATE TABLE `task_flags` (
	`issue_key` text PRIMARY KEY NOT NULL,
	`sent_to_usercare` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
