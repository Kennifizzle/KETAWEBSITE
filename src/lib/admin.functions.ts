import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminOrder {
  id: string
  reference: string
  side: string
  kind: string
  asset: string
  network: string | null
  amount: number
  amountCurrency: string
  usdAmount: number | null
  fullName: string
  email: string
  phone: string | null
  walletAddress: string | null
  bankName: string | null
  accountNumber: string | null
  accountName: string | null
  note: string | null
  status: string
  paymentStatus: string
  verificationStatus: string
  virtualAccountNumber: string | null
  virtualAccountBank: string | null
  paidAt: string | null
  createdAt: string
}

export interface AdminWaitlistRow {
  id: string
  kind: string
  name: string
  email: string
  phone: string | null
  country: string | null
  note: string | null
  createdAt: string
}

export interface AdminCustomer {
  email: string
  name: string
  phone: string | null
  orders: number
  volumeNgn: number
  lastOrderAt: string
  verified: boolean
}

export interface AdminActivityRow {
  id: string
  event: string
  level: string
  reference: string | null
  actor: string | null
  message: string | null
  meta: string
  createdAt: string
}

export interface AdminOverview {
  orders: number
  ordersToday: number
  pending: number
  paid: number
  volumeNgn: number
  waitlist: number
  vendors: number
}

export interface RatesView {
  buySpread: number
  sellSpread: number
  manualUsdNgn: number | null
  manualPrices: Record<string, number>
  liveUsdNgn: number
  livePrices: Record<string, number | null>
  updatedAt: string | null
}

const TRACKED_ASSETS = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB', 'TRX']

type Ctx = { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> } }

async function assertStaff(context: Ctx, adminOnly = false) {
  const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
    context.supabase.rpc('has_role', { _user_id: (context as never as { userId: string }).userId, _role: 'admin' }),
    context.supabase.rpc('has_role', { _user_id: (context as never as { userId: string }).userId, _role: 'staff' }),
  ])
  if (isAdmin === true) return 'admin' as const
  if (!adminOnly && isStaff === true) return 'staff' as const
  throw new Error('Forbidden')
}

// ---------------------------------------------------------------------------
// Access
// ---------------------------------------------------------------------------

/** Tells the UI whether the signed-in user may open the backend. */
export const getMyAccess = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'staff' }),
    ])
    return {
      userId: context.userId,
      email: (context.claims as { email?: string } | null)?.email ?? null,
      role: isAdmin ? ('admin' as const) : isStaff ? ('staff' as const) : null,
    }
  })

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getOverview = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertStaff(context as never)
    const { data: orders } = await context.supabase
      .from('orders')
      .select('amount, status, payment_status, created_at')
    const { data: waitlist } = await context.supabase.from('waitlist_signups').select('kind')

    const today = new Date().toISOString().slice(0, 10)
    const rows = orders ?? []
    return {
      orders: rows.length,
      ordersToday: rows.filter((o) => String(o.created_at).slice(0, 10) === today).length,
      pending: rows.filter((o) => o.status === 'pending').length,
      paid: rows.filter((o) => o.payment_status === 'paid').length,
      volumeNgn: rows.reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
      waitlist: (waitlist ?? []).length,
      vendors: (waitlist ?? []).filter((w) => w.kind === 'vendor').length,
    }
  })

const listSchema = z.object({
  status: z.string().trim().max(40).optional(),
  side: z.enum(['buy', 'sell']).optional(),
  search: z.string().trim().max(120).optional(),
})

export const listOrders = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<AdminOrder[]> => {
    await assertStaff(context as never)
    let query = context.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
    if (data.status) query = query.eq('status', data.status)
    if (data.side) query = query.eq('side', data.side)
    if (data.search) {
      const term = `%${data.search}%`
      query = query.or(`reference.ilike.${term},email.ilike.${term},full_name.ilike.${term}`)
    }
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    return (rows ?? []).map((o) => ({
      id: o.id,
      reference: o.reference,
      side: o.side,
      kind: o.kind,
      asset: o.asset,
      network: o.network,
      amount: Number(o.amount),
      amountCurrency: o.amount_currency,
      usdAmount: o.usd_amount == null ? null : Number(o.usd_amount),
      fullName: o.full_name,
      email: o.email,
      phone: o.phone,
      walletAddress: o.wallet_address,
      bankName: o.bank_name,
      accountNumber: o.account_number,
      accountName: o.account_name,
      note: o.note,
      status: o.status,
      paymentStatus: o.payment_status,
      verificationStatus: o.verification_status,
      virtualAccountNumber: o.virtual_account_number,
      virtualAccountBank: o.virtual_account_bank,
      paidAt: o.paid_at,
      createdAt: o.created_at,
    }))
  })

const statusSchema = z.object({
  reference: z.string().trim().min(3).max(40),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
})

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never, true)
    const { error } = await context.supabase
      .from('orders')
      .update({ status: data.status })
      .eq('reference', data.reference)
    if (error) throw new Error(error.message)
    const { logActivity } = await import('@/lib/activity.server')
    await logActivity({
      event: 'order.status_changed',
      reference: data.reference,
      actor: (context.claims as { email?: string } | null)?.email ?? context.userId,
      message: `Order marked ${data.status}`,
    })
    return { ok: true as const }
  })

export const listWaitlist = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminWaitlistRow[]> => {
    await assertStaff(context as never)
    const { data, error } = await context.supabase
      .from('waitlist_signups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw new Error(error.message)
    return (data ?? []).map((w) => ({
      id: w.id,
      kind: w.kind,
      name: w.name,
      email: w.email,
      phone: w.phone,
      country: w.country,
      note: w.note,
      createdAt: w.created_at,
    }))
  })

export const listCustomers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCustomer[]> => {
    await assertStaff(context as never)
    const { data, error } = await context.supabase
      .from('orders')
      .select('full_name, email, phone, amount, created_at, verification_status')
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) throw new Error(error.message)
    const map = new Map<string, AdminCustomer>()
    for (const row of data ?? []) {
      const key = String(row.email).toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.orders += 1
        existing.volumeNgn += Number(row.amount ?? 0)
        existing.verified = existing.verified || row.verification_status === 'verified'
        continue
      }
      map.set(key, {
        email: row.email,
        name: row.full_name,
        phone: row.phone,
        orders: 1,
        volumeNgn: Number(row.amount ?? 0),
        lastOrderAt: row.created_at,
        verified: row.verification_status === 'verified',
      })
    }
    return [...map.values()].sort((a, b) => b.volumeNgn - a.volumeNgn)
  })

export const listActivity = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminActivityRow[]> => {
    await assertStaff(context as never)
    const { data, error } = await context.supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return (data ?? []).map((a) => ({
      id: a.id,
      event: a.event,
      level: a.level,
      reference: a.reference,
      actor: a.actor,
      message: a.message,
      meta: JSON.stringify(a.meta ?? {}),
      createdAt: a.created_at,
    }))
  })

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

export const getRates = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RatesView> => {
    await assertStaff(context as never)
    const { getRateSettings, getUsdNgnRate, getAssetUsdPrice } = await import(
      '@/lib/payments.server'
    )
    const [settings, liveUsdNgn, prices] = await Promise.all([
      getRateSettings(),
      getUsdNgnRate(),
      Promise.all(TRACKED_ASSETS.map((a) => getAssetUsdPrice(a))),
    ])
    const { data } = await context.supabase
      .from('rate_settings')
      .select('updated_at')
      .eq('scope', 'default')
      .maybeSingle()
    const livePrices: Record<string, number | null> = {}
    TRACKED_ASSETS.forEach((asset, i) => {
      livePrices[asset] = prices[i] ?? null
    })
    return {
      buySpread: settings.buySpread,
      sellSpread: settings.sellSpread,
      manualUsdNgn: settings.manualUsdNgn,
      manualPrices: settings.manualPrices,
      liveUsdNgn,
      livePrices,
      updatedAt: data?.updated_at ?? null,
    }
  })

const ratesSchema = z.object({
  buySpread: z.number().min(0).max(0.5),
  sellSpread: z.number().min(0).max(0.5),
  manualUsdNgn: z.number().positive().max(100000).nullable(),
  manualPrices: z.record(z.string(), z.number().positive()),
})

export const updateRates = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ratesSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never, true)
    const { error } = await context.supabase
      .from('rate_settings')
      .update({
        buy_spread: data.buySpread,
        sell_spread: data.sellSpread,
        manual_usd_ngn: data.manualUsdNgn,
        manual_prices: data.manualPrices as never,
        updated_by: context.userId,
      })
      .eq('scope', 'default')
    if (error) throw new Error(error.message)
    const { logActivity } = await import('@/lib/activity.server')
    await logActivity({
      event: 'rates.updated',
      actor: (context.claims as { email?: string } | null)?.email ?? context.userId,
      message: 'Desk rates updated',
      meta: data as unknown as Record<string, unknown>,
    })
    return { ok: true as const }
  })

export const TRACKED_ASSET_LIST = TRACKED_ASSETS

// ---------------------------------------------------------------------------
// Team roles (admin only)
// ---------------------------------------------------------------------------

export interface UserRoleRow {
  email: string
  role: 'admin' | 'staff' | null
  hasAccount: boolean
}

async function findUsersByEmail(emails: string[]) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const wanted = new Set(emails.map((e) => e.toLowerCase()))
  const found = new Map<string, string>() // email -> user id
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    for (const u of data.users) {
      const mail = (u.email ?? '').toLowerCase()
      if (mail && (wanted.size === 0 || wanted.has(mail))) found.set(mail, u.id)
    }
    if (data.users.length < 1000) break
  }
  return found
}

/** Roles for a list of customer emails, so the desk can manage team access. */
export const getRolesForEmails = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ emails: z.array(z.string().email()).max(500) }).parse(data),
  )
  .handler(async ({ data, context }): Promise<UserRoleRow[]> => {
    await assertStaff(context as never, true)
    if (!data.emails.length) return []
    const users = await findUsersByEmail(data.emails)
    const ids = [...users.values()]
    const { data: roles } = ids.length
      ? await context.supabase.from('user_roles').select('user_id, role').in('user_id', ids)
      : { data: [] as { user_id: string; role: string }[] }
    const byId = new Map<string, 'admin' | 'staff'>()
    for (const r of roles ?? []) {
      const current = byId.get(r.user_id)
      if (r.role === 'admin' || !current) byId.set(r.user_id, r.role as 'admin' | 'staff')
    }
    return data.emails.map((email) => {
      const id = users.get(email.toLowerCase())
      return {
        email,
        role: id ? (byId.get(id) ?? null) : null,
        hasAccount: Boolean(id),
      }
    })
  })

const setRoleSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'staff']).nullable(),
})

/** Promote or demote a user. Admin only; cannot demote yourself. */
export const setUserRole = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => setRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as never, true)
    const users = await findUsersByEmail([data.email])
    const userId = users.get(data.email.toLowerCase())
    if (!userId) {
      throw new Error('No account found for that email — they must sign up first.')
    }
    if (userId === context.userId && data.role !== 'admin') {
      throw new Error('You cannot remove your own admin access.')
    }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error: delError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (delError) throw new Error(delError.message)
    if (data.role) {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role: data.role })
      if (error) throw new Error(error.message)
    }
    const { logActivity } = await import('@/lib/activity.server')
    await logActivity({
      event: 'roles.updated',
      actor: (context.claims as { email?: string } | null)?.email ?? context.userId,
      message: data.role
        ? `${data.email} set to ${data.role}`
        : `${data.email} access removed`,
      meta: { email: data.email, role: data.role },
    })
    return { ok: true as const, role: data.role }
  })
