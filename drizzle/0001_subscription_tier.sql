-- Subscription tiers: free (20 chats lifetime), standard (500/month), pro (unlimited + full model catalog).
ALTER TABLE `users`
	ADD COLUMN `subscription_tier` varchar(16) NOT NULL DEFAULT 'free' AFTER `alt_model_ids`;

-- Pro tier for Elliott (adjust email if needed).
UPDATE `users`
SET `subscription_tier` = 'pro'
WHERE LOWER(`email`) LIKE '%elliott%'
	OR LOWER(`email`) LIKE '%eliott%';
