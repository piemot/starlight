ALTER TABLE `tickets` ADD `claimed_by_id` text(20);--> statement-breakpoint
ALTER TABLE `tickets` ADD `status` text DEFAULT 'open' NOT NULL;