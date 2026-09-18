-- BVN at rest: encrypt + purge (NDPA compliance, Option A + B).
--
-- The `orders.bvn` column now stores a `v1:iv:tag:ciphertext` AES-256-GCM token
-- produced by src/lib/crypto.server.ts, or NULL when redacted. No schema change
-- is required because the column is still TEXT; the backfill of legacy plaintext
-- rows is performed by src/scripts/migrate-bvn-encrypt.mts (it needs the server
-- only BVN_ENCRYPTION_KEY, so it cannot run in SQL).
--
-- This migration adds:
--   1. a documentation comment on the column so auditors see the intent
--   2. a manual SQL helper to purge stale, still-plaintext BVNs as a stopgap

comment on column public.orders.bvn is
  'AES-256-GCM ciphertext ("v1:iv:tag:token") of the customer BVN, or NULL once redacted. NDPA-sensitive: rotate BVN_ENCRYPTION_KEY with care.';

comment on column public.orders.payment_status is
  'awaiting_account | awaiting_payment | paid | bvn_rejected | account_failed | manual_account';

-- Manual stopgap for operators: nuke BVNs from orders that never got an account
-- and are older than `retention_days` (default 7). New code already purges
-- automatically on account creation, so this is only for legacy/stuck rows.
create or replace function public.purge_stale_orders_bvn(retention_days integer default 7)
returns bigint
language plpgsql
as $$
declare
  removed bigint;
begin
  update public.orders
  set bvn = null
  where virtual_account_number is null
    and payment_status not in ('bvn_rejected', 'awaiting_account')
    and (created_at < (now() - (retention_days || ' days')::interval))
    and bvn is not null;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- pg_cron is not enabled on every tier, so we do NOT auto-schedule. Call manually:
--   select public.purge_stale_orders_bvn(7);
-- Or, if pg_cron is available:
--   select cron.schedule('nightly-bvn-retention', '0 1 * * *', $$select public.purge_stale_orders_bvn(7)$$);
