CREATE TYPE public.waitlist_kind AS ENUM ('trader', 'vendor');

CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind public.waitlist_kind NOT NULL DEFAULT 'trader',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon;
GRANT INSERT ON public.waitlist_signups TO authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_signups FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND (phone IS NULL OR length(phone) <= 30)
    AND (country IS NULL OR length(country) <= 80)
    AND (note IS NULL OR length(note) <= 500)
  );