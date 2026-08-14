CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`calculation_id` text,
	`status` text NOT NULL,
	`requested_at` text NOT NULL,
	`decided_at` text,
	`actor_id` text,
	`reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`calculation_id`) REFERENCES `pricing_calculations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`metadata_json` text
);
--> statement-breakpoint
CREATE INDEX `audit_logs_target_idx` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `brands` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `brands_name_unique` ON `brands` (`name`);--> statement-breakpoint
CREATE TABLE `countries` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`default_currency_code` text NOT NULL,
	`market_role` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`code` text PRIMARY KEY NOT NULL,
	`minor_units` integer NOT NULL,
	`symbol` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`from_currency_code` text NOT NULL,
	`to_currency_code` text NOT NULL,
	`rate` text NOT NULL,
	`basis` text NOT NULL,
	`observed_at` text NOT NULL,
	`source` text NOT NULL,
	`version` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exchange_rates_pair_observed_idx` ON `exchange_rates` (`from_currency_code`,`to_currency_code`,`observed_at`);--> statement-breakpoint
CREATE TABLE `pricing_calculations` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`source_url` text NOT NULL,
	`source_name` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`engine_version` text NOT NULL,
	`policy_version` text NOT NULL,
	`calculated_at` text NOT NULL,
	`input_json` text NOT NULL,
	`output_json` text NOT NULL,
	`external_product_payload_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pricing_calculations_source_url_idx` ON `pricing_calculations` (`source_url`);--> statement-breakpoint
CREATE INDEX `pricing_calculations_calculated_at_idx` ON `pricing_calculations` (`calculated_at`);--> statement-breakpoint
CREATE TABLE `pricing_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`target_margin_rate_basis_points` integer NOT NULL,
	`payment_fee_rate_basis_points` integer NOT NULL,
	`rounding_currency_code` text NOT NULL,
	`rounding_increment_minor` text NOT NULL,
	`rounding_mode` text NOT NULL,
	`effective_from` text NOT NULL,
	`source` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pricing_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`calculation_id` text NOT NULL,
	`product_id` text,
	`engine_version` text NOT NULL,
	`policy_version` text NOT NULL,
	`calculated_at` text NOT NULL,
	`snapshot_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`calculation_id`) REFERENCES `pricing_calculations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pricing_snapshots_calculation_id_idx` ON `pricing_snapshots` (`calculation_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text NOT NULL,
	`source_market_code` text NOT NULL,
	`external_product_id` text,
	`name` text NOT NULL,
	`brand_id` text,
	`raw_payload_json` text,
	`source_observed_at` text NOT NULL,
	`adapter_version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_source_url_unique` ON `products` (`source_url`);--> statement-breakpoint
CREATE INDEX `products_external_product_id_idx` ON `products` (`external_product_id`);--> statement-breakpoint
CREATE TABLE `shipping_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`source_country_code` text NOT NULL,
	`destination_country_code` text NOT NULL,
	`method` text NOT NULL,
	`flat_cost_amount_minor` text NOT NULL,
	`flat_cost_currency_code` text NOT NULL,
	`effective_from` text NOT NULL,
	`source` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tariff_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`source_country_code` text NOT NULL,
	`destination_country_code` text NOT NULL,
	`product_category` text NOT NULL,
	`rate_basis_points` integer NOT NULL,
	`classification_basis` text NOT NULL,
	`determination` text NOT NULL,
	`source` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`version` text NOT NULL,
	`disclaimer` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`country_code` text NOT NULL,
	`kind` text NOT NULL,
	`rate_basis_points` integer NOT NULL,
	`taxable_base` text NOT NULL,
	`effective_from` text NOT NULL,
	`source` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`version` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text,
	`color` text,
	`size` text,
	`availability` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `variants_product_id_idx` ON `variants` (`product_id`);
