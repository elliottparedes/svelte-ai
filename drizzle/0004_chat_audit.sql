ALTER TABLE `messages`
	ADD COLUMN `turn_id` VARCHAR(36) NULL,
	ADD COLUMN `turn_sequence` INT NULL,
	ADD COLUMN `tool_name` VARCHAR(64) NULL,
	ADD COLUMN `tool_arguments_json` LONGTEXT NULL,
	ADD INDEX `msg_turn_id_idx` (`turn_id`);

--> statement-breakpoint

CREATE TABLE `conversation_turns` (
	`id` VARCHAR(36) NOT NULL PRIMARY KEY,
	`conversation_id` VARCHAR(36) NOT NULL,
	`user_id` VARCHAR(36) NOT NULL,
	`user_message_id` VARCHAR(36) NOT NULL,
	`assistant_message_id` VARCHAR(36) NULL,
	`model_id` VARCHAR(128) NOT NULL,
	`route_source` VARCHAR(32) NULL,
	`route_tier` VARCHAR(32) NULL,
	`deep_reasoning` INT NOT NULL DEFAULT 0,
	`enabled_tool_names_json` TEXT NULL,
	`attachments_json` LONGTEXT NULL,
	`request_meta_json` LONGTEXT NULL,
	`tool_calls_json` LONGTEXT NULL,
	`prompt_chars` INT NOT NULL DEFAULT 0,
	`response_chars` INT NOT NULL DEFAULT 0,
	`llm_cost_usd` DECIMAL(10, 6) NULL,
	`tool_cost_usd` DECIMAL(10, 6) NULL,
	`total_cost_usd` DECIMAL(10, 6) NULL,
	`prompt_tokens` INT NULL,
	`completion_tokens` INT NULL,
	`status` VARCHAR(16) NOT NULL DEFAULT 'completed',
	`error_message` TEXT NULL,
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	INDEX `turn_conversation_id_idx` (`conversation_id`),
	INDEX `turn_user_id_idx` (`user_id`),
	INDEX `turn_created_at_idx` (`created_at`)
);

--> statement-breakpoint

CREATE TABLE `conversation_issue_reports` (
	`id` VARCHAR(36) NOT NULL PRIMARY KEY,
	`conversation_id` VARCHAR(36) NOT NULL,
	`turn_id` VARCHAR(36) NOT NULL,
	`reported_by_user_id` VARCHAR(36) NOT NULL,
	`latest_message_id` VARCHAR(36) NULL,
	`client_context_json` LONGTEXT NULL,
	`status` VARCHAR(16) NOT NULL DEFAULT 'open',
	`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	INDEX `issue_conversation_id_idx` (`conversation_id`),
	INDEX `issue_turn_id_idx` (`turn_id`),
	INDEX `issue_user_id_idx` (`reported_by_user_id`)
);
