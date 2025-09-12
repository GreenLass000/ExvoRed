CREATE TABLE `exvoto_image` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exvoto_id` integer NOT NULL,
	`image` blob NOT NULL,
	`caption` text,
	`updated_at` text
);
