ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bvn text;

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ((length(full_name) >= 1) AND (length(full_name) <= 100))
  AND ((length(email) >= 3) AND (length(email) <= 255))
  AND ((length(asset) >= 1) AND (length(asset) <= 40))
  AND (amount > (0)::numeric) AND (amount <= (100000000)::numeric)
  AND ((phone IS NULL) OR (length(phone) <= 30))
  AND ((network IS NULL) OR (length(network) <= 40))
  AND ((wallet_address IS NULL) OR (length(wallet_address) <= 200))
  AND ((bank_name IS NULL) OR (length(bank_name) <= 100))
  AND ((account_number IS NULL) OR (length(account_number) <= 30))
  AND ((account_name IS NULL) OR (length(account_name) <= 100))
  AND ((note IS NULL) OR (length(note) <= 500))
  AND ((bvn IS NULL) OR (length(bvn) = 11))
);