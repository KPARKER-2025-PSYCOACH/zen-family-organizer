
-- Table to store Google Sheets connections for spending tracking
CREATE TABLE public.sheets_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Family Budget',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

ALTER TABLE public.sheets_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sheets" ON public.sheets_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sheets" ON public.sheets_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sheets" ON public.sheets_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sheets" ON public.sheets_connections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_sheets_connections_updated_at
  BEFORE UPDATE ON public.sheets_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
