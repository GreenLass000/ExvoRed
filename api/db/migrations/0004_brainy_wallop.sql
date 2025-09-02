PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_catalog` (
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
	`comments` text,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_catalog`("id", "title", "reference", "author", "publication_year", "publication_place", "catalog_location", "exvoto_count", "location_description", "oldest_exvoto_date", "newest_exvoto_date", "other_exvotos", "numero_exvotos", "comments", "updated_at") SELECT "id", "title", "reference", "author", "publication_year", "publication_place", "catalog_location", "exvoto_count", "location_description", "oldest_exvoto_date", "newest_exvoto_date", "other_exvotos", "numero_exvotos", "comments", "updated_at" FROM `catalog`;--> statement-breakpoint
DROP TABLE `catalog`;--> statement-breakpoint
ALTER TABLE `__new_catalog` RENAME TO `catalog`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_character` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_character`("id", "name", "updated_at") SELECT "id", "name", "updated_at" FROM `character`;--> statement-breakpoint
DROP TABLE `character`;--> statement-breakpoint
ALTER TABLE `__new_character` RENAME TO `character`;--> statement-breakpoint
CREATE TABLE `__new_divinity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(150) NOT NULL,
	`attributes` text,
	`history` text,
	`representation` text,
	`representation_image` blob,
	`comments` text,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_divinity`("id", "name", "attributes", "history", "representation", "representation_image", "comments", "updated_at") SELECT "id", "name", "attributes", "history", "representation", "representation_image", "comments", "updated_at" FROM `divinity`;--> statement-breakpoint
DROP TABLE `divinity`;--> statement-breakpoint
ALTER TABLE `__new_divinity` RENAME TO `divinity`;--> statement-breakpoint
CREATE TABLE `__new_exvoto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`internal_id` text(20),
	`offering_sem_id` integer,
	`lugar_origen` text(200),
	`conservation_sem_id` integer,
	`province` text(50),
	`virgin_or_saint` text(100),
	`exvoto_date` text,
	`epoch` text(25),
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
	`image` blob,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_exvoto`("id", "internal_id", "offering_sem_id", "lugar_origen", "conservation_sem_id", "province", "virgin_or_saint", "exvoto_date", "epoch", "benefited_name", "offerer_name", "offerer_gender", "offerer_relation", "characters", "profession", "social_status", "miracle", "miracle_place", "material", "dimensions", "text_case", "text_form", "extra_info", "transcription", "conservation_status", "image", "updated_at") SELECT "id", "internal_id", "offering_sem_id", "lugar_origen", "conservation_sem_id", "province", "virgin_or_saint", "exvoto_date", "epoch", "benefited_name", "offerer_name", "offerer_gender", "offerer_relation", "characters", "profession", "social_status", "miracle", "miracle_place", "material", "dimensions", "text_case", "text_form", "extra_info", "transcription", "conservation_status", "image", "updated_at" FROM `exvoto`;--> statement-breakpoint
DROP TABLE `exvoto`;--> statement-breakpoint
ALTER TABLE `__new_exvoto` RENAME TO `exvoto`;--> statement-breakpoint
CREATE TABLE `__new_miracle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_miracle`("id", "name", "updated_at") SELECT "id", "name", "updated_at" FROM `miracle`;--> statement-breakpoint
DROP TABLE `miracle`;--> statement-breakpoint
ALTER TABLE `__new_miracle` RENAME TO `miracle`;--> statement-breakpoint
CREATE TABLE `__new_sem` (
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
	`contact` text,
	`updated_at` text
);
--> statement-breakpoint
INSERT INTO `__new_sem`("id", "name", "region", "province", "town", "associated_divinity", "festivity", "pictorial_exvoto_count", "oldest_exvoto_date", "newest_exvoto_date", "other_exvotos", "numero_exvotos", "comments", "references", "contact", "updated_at") SELECT "id", "name", "region", "province", "town", "associated_divinity", "festivity", "pictorial_exvoto_count", "oldest_exvoto_date", "newest_exvoto_date", "other_exvotos", "numero_exvotos", "comments", "references", "contact", "updated_at" FROM `sem`;--> statement-breakpoint
DROP TABLE `sem`;--> statement-breakpoint
ALTER TABLE `__new_sem` RENAME TO `sem`;