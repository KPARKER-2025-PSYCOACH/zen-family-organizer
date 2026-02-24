
-- Table for blocked/spam senders
CREATE TABLE public.blocked_senders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint so a sender can only be blocked once per user
CREATE UNIQUE INDEX idx_blocked_senders_user_email ON public.blocked_senders (user_id, sender_email);

ALTER TABLE public.blocked_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocked senders"
  ON public.blocked_senders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can block senders"
  ON public.blocked_senders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock senders"
  ON public.blocked_senders FOR DELETE USING (auth.uid() = user_id);

-- Add email_category column to detected_events for sectioning
-- Values: 'event', 'action_required', 'order', 'promotion'
ALTER TABLE public.detected_events
  ADD COLUMN IF NOT EXISTS email_category TEXT NOT NULL DEFAULT 'event';
