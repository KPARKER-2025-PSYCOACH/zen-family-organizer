
-- Create family_members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  color TEXT NOT NULL DEFAULT 'hsl(175 26% 34%)',
  dietary_requirements TEXT[] NOT NULL DEFAULT '{}',
  likes TEXT[] NOT NULL DEFAULT '{}',
  dislikes TEXT[] NOT NULL DEFAULT '{}',
  hobbies TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own family members"
ON public.family_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family members"
ON public.family_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family members"
ON public.family_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family members"
ON public.family_members FOR DELETE
USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
