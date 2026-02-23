
-- Add unique constraints for upsert support
ALTER TABLE public.calendar_connections ADD CONSTRAINT calendar_connections_user_provider_unique UNIQUE (user_id, provider);
ALTER TABLE public.email_connections ADD CONSTRAINT email_connections_user_provider_unique UNIQUE (user_id, provider);
