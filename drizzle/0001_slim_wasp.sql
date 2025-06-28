CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text(20) NOT NULL,
	`channel_id` text(20) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_channel_id_unique` ON `tickets` (`channel_id`);