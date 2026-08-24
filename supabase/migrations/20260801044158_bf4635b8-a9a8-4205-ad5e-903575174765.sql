ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS usd_amount numeric,
  ADD COLUMN IF NOT EXISTS usd_rate numeric,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'awaiting_account',
  ADD COLUMN IF NOT EXISTS virtual_account_number text,
  ADD COLUMN IF NOT EXISTS virtual_account_bank text,
  ADD COLUMN IF NOT EXISTS virtual_account_name text,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_provider_ref text,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS verification_provider text,
  ADD COLUMN IF NOT EXISTS verification_ref text,
  ADD COLUMN IF NOT EXISTS verification_url text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS orders_reference_idx ON public.orders (reference);
CREATE INDEX IF NOT EXISTS orders_payment_provider_ref_idx ON public.orders (payment_provider_ref);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();