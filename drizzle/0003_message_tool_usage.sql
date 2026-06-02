ALTER TABLE `messages`
	ADD COLUMN `tool_cost_usd` DECIMAL(10, 6) NULL,
	ADD COLUMN `tool_usage_json` TEXT NULL;
