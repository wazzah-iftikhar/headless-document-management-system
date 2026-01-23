CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`filename` text NOT NULL,
	`original_filename` text NOT NULL,
	`file_path` text NOT NULL,
	`file_size` integer NOT NULL,
	`checksum` text,
	`metadata_tags` text DEFAULT '[]' NOT NULL,
	CONSTRAINT "file_size_positive" CHECK("documents"."file_size" > 0)
);
--> statement-breakpoint
CREATE INDEX `documents_filename_idx` ON `documents` (`filename`);--> statement-breakpoint
CREATE INDEX `documents_file_path_idx` ON `documents` (`file_path`);--> statement-breakpoint
CREATE INDEX `documents_created_at_idx` ON `documents` (`created_at`);--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`document_id` text NOT NULL,
	`version_number` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "version_number_positive" CHECK("document_versions"."version_number" >= 1)
);
--> statement-breakpoint
CREATE INDEX `document_versions_document_id_idx` ON `document_versions` (`document_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_versions_document_version_unique` ON `document_versions` (`document_id`,`version_number`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`workspace_ids` text DEFAULT '[]' NOT NULL,
	`is_active` text DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_is_active_idx` ON `users` (`is_active`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `users` (`created_at`);--> statement-breakpoint
CREATE TABLE `access_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`actions` text DEFAULT '[]' NOT NULL,
	`is_active` text DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `access_policies_subject_idx` ON `access_policies` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `access_policies_resource_idx` ON `access_policies` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `access_policies_is_active_idx` ON `access_policies` (`is_active`);--> statement-breakpoint
CREATE INDEX `access_policies_subject_resource_active_idx` ON `access_policies` (`subject_type`,`subject_id`,`resource_type`,`resource_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `access_policies_created_at_idx` ON `access_policies` (`created_at`);