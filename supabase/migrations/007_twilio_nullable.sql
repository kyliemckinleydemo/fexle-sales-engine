-- ==================== TWILIO CREDENTIALS NULLABLE FIX ====================
-- The original migration had auth_token_encrypted as NOT NULL, but we now use
-- API Keys (api_key_sid + api_key_secret) instead of Auth Tokens for security.
-- Make the old field nullable so the UI can save without it.

ALTER TABLE twilio_credentials ALTER COLUMN auth_token_encrypted DROP NOT NULL;

-- Also ensure phone_number has a default since caller_id is the primary field now
ALTER TABLE twilio_credentials ALTER COLUMN phone_number DROP NOT NULL;
