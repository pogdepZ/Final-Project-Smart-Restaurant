-- Add Stripe payment support to bills table
-- Run this migration to add stripe_payment_intent_id column

ALTER TABLE bills
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bills_stripe_payment_intent_id 
ON bills(stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

-- Comment
COMMENT ON COLUMN bills.stripe_payment_intent_id IS 'Stripe Payment Intent ID for online payments';
