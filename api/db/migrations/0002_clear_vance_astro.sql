PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	`image` blob
);
--> statement-breakpoint
INSERT INTO `__new_exvoto`("id", "internal_id", "offering_sem_id", "lugar_origen", "conservation_sem_id", "province", "virgin_or_saint", "exvoto_date", "epoch", "benefited_name", "offerer_name", "offerer_gender", "offerer_relation", "characters", "profession", "social_status", "miracle", "miracle_place", "material", "dimensions", "text_case", "text_form", "extra_info", "transcription", "conservation_status", "image") SELECT "id", "internal_id", "offering_sem_id", "lugar_origen", "conservation_sem_id", "province", "virgin_or_saint", "exvoto_date", "epoch", "benefited_name", "offerer_name", "offerer_gender", "offerer_relation", "characters", "profession", "social_status", "miracle", "miracle_place", "material", "dimensions", "text_case", "text_form", "extra_info", "transcription", "conservation_status", "image" FROM `exvoto`;--> statement-breakpoint
DROP TABLE `exvoto`;--> statement-breakpoint
ALTER TABLE `__new_exvoto` RENAME TO `exvoto`;--> statement-breakpoint
PRAGMA foreign_keys=ON;