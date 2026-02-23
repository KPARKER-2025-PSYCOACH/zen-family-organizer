
-- Calendar connections (Google, Apple, Outlook)
CREATE TABLE public.calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook')),
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected BOOLEAN NOT NULL DEFAULT true,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
  ON public.calendar_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own connections"
  ON public.calendar_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connections"
  ON public.calendar_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own connections"
  ON public.calendar_connections FOR DELETE USING (auth.uid() = user_id);

-- Calendar events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('school', 'health', 'travel', 'birthday', 'meal', 'work', 'personal', 'other')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'synced', 'email', 'document')),
  source_id TEXT,
  google_event_id TEXT,
  calendar_connection_id UUID REFERENCES public.calendar_connections(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events"
  ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events"
  ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events"
  ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Detected events from email/document scanning
CREATE TABLE public.detected_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'document')),
  source_subject TEXT,
  source_from TEXT,
  detected_date TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_end_date TIMESTAMP WITH TIME ZONE,
  title TEXT NOT NULL,
  description TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('school', 'health', 'travel', 'birthday', 'meal', 'work', 'personal', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  suggest_gift BOOLEAN NOT NULL DEFAULT false,
  gift_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detected events"
  ON public.detected_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own detected events"
  ON public.detected_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own detected events"
  ON public.detected_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own detected events"
  ON public.detected_events FOR DELETE USING (auth.uid() = user_id);

-- Email connections
CREATE TABLE public.email_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'yahoo', 'icloud')),
  email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected BOOLEAN NOT NULL DEFAULT true,
  folders_to_scan TEXT[] NOT NULL DEFAULT ARRAY['inbox'],
  last_scanned TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email connections"
  ON public.email_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email connections"
  ON public.email_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email connections"
  ON public.email_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email connections"
  ON public.email_connections FOR DELETE USING (auth.uid() = user_id);

-- Timestamp update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON public.email_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
