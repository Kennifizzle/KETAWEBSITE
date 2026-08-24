CREATE TYPE public.order_side AS ENUM ('buy','sell');
CREATE TYPE public.order_kind AS ENUM ('crypto','giftcard');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('KETA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  side public.order_side NOT NULL,
  kind public.order_kind NOT NULL DEFAULT 'crypto',
  asset text NOT NULL,
  network text,
  amount numeric(18,2) NOT NULL,
  amount_currency text NOT NULL DEFAULT 'NGN',
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  wallet_address text,
  bank_name text,
  account_number text,
  account_name text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX orders_reference_key ON public.orders (reference);

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (
  length(full_name) BETWEEN 1 AND 100
  AND length(email) BETWEEN 3 AND 255
  AND length(asset) BETWEEN 1 AND 40
  AND amount > 0 AND amount <= 100000000
  AND (phone IS NULL OR length(phone) <= 30)
  AND (network IS NULL OR length(network) <= 40)
  AND (wallet_address IS NULL OR length(wallet_address) <= 200)
  AND (bank_name IS NULL OR length(bank_name) <= 100)
  AND (account_number IS NULL OR length(account_number) <= 30)
  AND (account_name IS NULL OR length(account_name) <= 100)
  AND (note IS NULL OR length(note) <= 500)
);