CREATE TABLE `product_events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`product_id` text,
	`calculation_id` text,
	`approval_id` text,
	`actor_id` text,
	`experiment_variant` text,
	`occurred_at` text NOT NULL,
	`metadata_json` text
);
--> statement-breakpoint
CREATE INDEX `product_events_product_idx` ON `product_events` (`product_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `product_events_name_idx` ON `product_events` (`name`);
