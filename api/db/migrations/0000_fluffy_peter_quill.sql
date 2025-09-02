CREATE TABLE `catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(200),
	`reference` text(200),
	`author` text(100),
	`publication_year` integer,
	`publication_place` text(100),
	`catalog_location` text,
	`exvoto_count` integer,
	`location_description` text,
	`oldest_exvoto_date` text,
	`newest_exvoto_date` text,
	`other_exvotos` text,
	`numero_exvotos` integer,
	`comments` text
);
--> statement-breakpoint
CREATE TABLE `catalog_exvoto` (
	`catalog_id` integer NOT NULL,
	`exvoto_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_sem` (
	`catalog_id` integer NOT NULL,
	`sem_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exvoto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`internal_id` text(20),
	`offering_sem_id` integer,
	`origin_sem_id` integer,
	`conservation_sem_id` integer,
	`province` text(50),
	`virgin_or_saint` text(100),
	`exvoto_date` text,
	`benefited_name` text(100),
	`offerer_name` text(100),
	`offerer_gender` text(10),
	`offerer_relation` text(100),
	`characters` text(200),
	`profession` text(100),
	`social_status` text(100),
	`miracle` text(50),
	`miracle_place` text(200),
	`material` text(100),
	`dimensions` text(50),
	`text_case` text(20),
	`text_form` text(20),
	`extra_info` text(500),
	`transcription` text,
	`conservation_status` text(100),
	`image` blob
);
--> statement-breakpoint
CREATE TABLE `miracle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100),
	`region` text(100),
	`province` text(100),
	`town` text(100),
	`associated_divinity` text(100),
	`festivity` text(100),
	`pictorial_exvoto_count` integer,
	`oldest_exvoto_date` text,
	`newest_exvoto_date` text,
	`other_exvotos` text,
	`numero_exvotos` integer,
	`comments` text,
	`references` text,
	`contact` text
);
