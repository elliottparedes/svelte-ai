ALTER TABLE `messages`
	ADD COLUMN `cost_usd` DECIMAL(10, 6) NULL,
	ADD COLUMN `prompt_tokens` INT NULL,
	ADD COLUMN `completion_tokens` INT NULL;
