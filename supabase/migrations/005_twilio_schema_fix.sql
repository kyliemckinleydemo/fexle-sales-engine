-- ==================== TWILIO CREDENTIALS SCHEMA FIX ====================
-- Add missing columns that edge functions reference (twilio-voice, sms-send, twilio-token)
-- The original 004_features.sql table only has account_sid, auth_token_encrypted, phone_number
-- but edge functions select api_key_sid, api_key_secret, twiml_app_sid, caller_id

ALTER TABLE twilio_credentials ADD COLUMN IF NOT EXISTS api_key_sid TEXT;
ALTER TABLE twilio_credentials ADD COLUMN IF NOT EXISTS api_key_secret TEXT;
ALTER TABLE twilio_credentials ADD COLUMN IF NOT EXISTS twiml_app_sid TEXT;
ALTER TABLE twilio_credentials ADD COLUMN IF NOT EXISTS caller_id TEXT;

-- Backfill caller_id from existing phone_number column
UPDATE twilio_credentials SET caller_id = phone_number WHERE caller_id IS NULL;
