-- Manual tier changes until billing UI exists.
-- Tiers: free | standard | pro

-- Example: upgrade a user to Standard
-- UPDATE users SET subscription_tier = 'standard' WHERE email = 'user@example.com';

-- Elliott → Pro (matches drizzle/0001_subscription_tier.sql)
UPDATE users
SET subscription_tier = 'pro'
WHERE LOWER(email) LIKE '%elliott%'
	OR LOWER(email) LIKE '%eliott%';
