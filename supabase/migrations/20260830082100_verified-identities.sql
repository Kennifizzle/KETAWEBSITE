-- One-time identity verification: a person (keyed by hashed BVN) who has
-- already passed DeepIDV skips KYC on future orders. No login required —
-- the BVN is the natural identity anchor.
CREATE TABLE public.verified_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bvn_hash TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'deepidv',
  provider_ref TEXT,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.verified_identities TO service_role;

ALTER TABLE public.verified_identities ENABLE ROW LEVEL SECURITY;