CREATE TABLE public.spending_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spending_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spending" ON public.spending_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spending" ON public.spending_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spending" ON public.spending_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spending" ON public.spending_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_spending_entries_updated_at
  BEFORE UPDATE ON public.spending_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();