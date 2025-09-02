CREATE TABLE `divinity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(150) NOT NULL,
	`attributes` text,
	`history` text,
	`representation` text,
	`representation_image` blob,
	`comments` text
);
--> statement-breakpoint
CREATE TABLE `divinity_sem` (
	`divinity_id` integer NOT NULL,
	`sem_id` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `exvoto` ADD `epoch` text(25);