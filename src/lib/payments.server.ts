// Server-only helpers for payments (Anchor virtual accounts) and identity
// verification (DeepIDV). Never import this from client components.

export const VERIFICATION_USD_THRESHOLD = 100

/** NGN per 1 USD, fetched live with a conservative fallback. */
export async function getUsdNgnRate(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { accept: 'application/json' },
    })
    if (res.ok) {
      const json = (await res.json()) as { rates?: Record<string, number> }
      const ngn = json.rates?.['NGN']
      if (typeof ngn === 'number' && ngn > 0) return ngn
    }
    console.error('usd rate lookup failed', res.status)
  } catch (e) {
    console.error('usd rate lookup error', e)
  }
  // Fallback keeps the threshold conservative (more orders get verified).
  return 1500
}

function anchorConfig() {
  const apiKey = process.env['ANCHOR_API_KEY']
  const settlementAccountId = process.env['ANCHOR_SETTLEMENT_ACCOUNT_ID']
  const env = (process.env['ANCHOR_ENVIRONMENT'] ?? 'sandbox').toLowerCase()
  const baseUrl =
    env === 'live' || env === 'production'
      ? 'https://api.getanchor.co'
      : 'https://api.sandbox.getanchor.co'
  if (!apiKey) throw new Error('ANCHOR_API_KEY is not configured')
  return { apiKey, baseUrl, settlementAccountId }
}

/** Error raised when the provider rejects the customer's BVN / identity data. */
export class BvnRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BvnRejectedError'
  }
}

function looksLikeBvnRejection(status: number, text: string) {
  const t = text.toLowerCase()
  if (t.includes('bvn') || t.includes('name mismatch') || t.includes('date of birth')) return true
  return status === 400 || status === 422
}

async function anchorFetch(path: string, init: RequestInit) {
  const { apiKey, baseUrl } = anchorConfig()
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'x-anchor-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`anchor ${path} failed [${res.status}]: ${text}`)
    if (looksLikeBvnRejection(res.status, text)) {
      throw new BvnRejectedError(
        'We could not verify that BVN with your name. Check the 11 digits and try again.',
      )
    }
    throw new Error(`Anchor request failed [${res.status}]: ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] ?? 'Customer'
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'Customer'
  return { firstName, lastName }
}

export interface VirtualAccount {
  accountNumber: string
  bankName: string
  accountName: string
  providerRef: string
  expiresAt: string | null
}

/**
 * Creates a dedicated (temporary) virtual NUBAN for a single order so the
 * customer can pay by ordinary bank transfer.
 */
export async function createAnchorVirtualAccount(input: {
  reference: string
  fullName: string
  email: string
  phone?: string | null
  bvn?: string | null
}): Promise<VirtualAccount> {
  const { settlementAccountId } = anchorConfig()
  if (!settlementAccountId) throw new Error('ANCHOR_SETTLEMENT_ACCOUNT_ID is not configured')

  // Anchor verifies the payer with name, email and BVN before it will issue a
  // dedicated NUBAN. We use the customer's own BVN (collected on the order
  // form); the business BVN is only a fallback for legacy orders.
  const bvn = (input.bvn ?? process.env['ANCHOR_BVN'] ?? '').replace(/\D/g, '')
  if (bvn.length !== 11) throw new Error('ANCHOR_BVN is not configured (11 digits required)')

  const { firstName, lastName } = splitName(input.fullName)

  const payload = {
    data: {
      type: 'VirtualNuban',
      attributes: {
        provider: 'providus',
        virtualAccountDetail: {
          name: `${firstName} ${lastName}`.slice(0, 60),
          bvn,
          email: input.email,
          reference: input.reference,
          permanent: false,
        },

      },
      relationships: {
        settlementAccount: {
          data: { id: settlementAccountId, type: 'DepositAccount' },
        },
      },
    },
  }


  const json = (await anchorFetch('/api/v1/virtual-nubans', {
    method: 'POST',
    body: JSON.stringify(payload),
  })) as {
    data?: {
      id?: string
      attributes?: {
        accountNumber?: string
        bankName?: string
        accountName?: string
        bank?: { name?: string }
        expiresAt?: string
        expiryDate?: string
      }
    }
  }

  const attrs = json.data?.attributes ?? {}
  const accountNumber = attrs.accountNumber
  if (!accountNumber) {
    throw new Error('Anchor did not return an account number')
  }

  return {
    accountNumber,
    bankName: attrs.bankName ?? attrs.bank?.name ?? 'Providus Bank',
    accountName: attrs.accountName ?? `${firstName} ${lastName}`,
    providerRef: json.data?.id ?? input.reference,
    expiresAt: attrs.expiresAt ?? attrs.expiryDate ?? null,
  }
}

export interface VerificationSession {
  ref: string
  url: string
}

/** Starts a DeepIDV identity check for high-value orders. */
export async function createDeepIdvSession(input: {
  reference: string
  fullName: string
  email: string
  phone?: string | null
  redirectUrl: string
  callbackUrl: string
}): Promise<VerificationSession> {
  const apiKey = process.env['DEEPIDV_API_KEY']
  if (!apiKey) throw new Error('DEEPIDV_API_KEY is not configured')
  const baseUrl = process.env['DEEPIDV_BASE_URL'] ?? 'https://api.deepidv.com'

  const res = await fetch(`${baseUrl}/v1/verifications`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      reference: input.reference,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone ?? undefined,
      redirect_url: input.redirectUrl,
      callback_url: input.callbackUrl,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`deepidv verification failed [${res.status}]: ${text}`)
    throw new Error(`DeepIDV request failed [${res.status}]: ${text}`)
  }

  const json = (text ? JSON.parse(text) : {}) as Record<string, any>
  const node = json.data ?? json.verification ?? json
  const url: string | undefined = node.url ?? node.link ?? node.verification_url
  const ref: string | undefined = node.id ?? node.reference ?? input.reference
  if (!url) throw new Error('DeepIDV did not return a verification link')

  return { ref: ref ?? input.reference, url }
}

// ---------------------------------------------------------------------------
// Live pricing
// ---------------------------------------------------------------------------

/** Desk spread applied to the market price. */
export const BUY_SPREAD = 0.025
export const SELL_SPREAD = 0.025

const COINGECKO_IDS: Record<string, string> = {
  USDT: 'tether',
  USDC: 'usd-coin',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  TRX: 'tron',
}

/** Market price of one unit of `asset` in USD. */
export async function getAssetUsdPrice(asset: string): Promise<number | null> {
  const id = COINGECKO_IDS[asset.toUpperCase()]
  if (!id) return null
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      { headers: { accept: 'application/json' } },
    )
    if (res.ok) {
      const json = (await res.json()) as Record<string, { usd?: number }>
      const usd = json[id]?.usd
      if (typeof usd === 'number' && usd > 0) return usd
    }
    console.error('asset price lookup failed', asset, res.status)
  } catch (e) {
    console.error('asset price lookup error', asset, e)
  }
  return null
}

export interface Quote {
  asset: string
  side: 'buy' | 'sell'
  amountNgn: number
  usdRate: number
  usdAmount: number
  assetPriceUsd: number | null
  /** Customer-facing NGN price for one unit, spread included. */
  unitPriceNgn: number | null
  /** Units of the asset the customer gets / delivers. */
  quantity: number | null
}

export interface RateSettings {
  buySpread: number
  sellSpread: number
  manualUsdNgn: number | null
  manualPrices: Record<string, number>
}

const DEFAULT_RATE_SETTINGS: RateSettings = {
  buySpread: BUY_SPREAD,
  sellSpread: SELL_SPREAD,
  manualUsdNgn: null,
  manualPrices: {},
}

/** Desk-configured spreads and manual rate overrides set in the admin backend. */
export async function getRateSettings(): Promise<RateSettings> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data } = await supabaseAdmin
      .from('rate_settings')
      .select('buy_spread, sell_spread, manual_usd_ngn, manual_prices')
      .eq('scope', 'default')
      .maybeSingle()
    if (!data) return DEFAULT_RATE_SETTINGS
    const prices: Record<string, number> = {}
    const raw = (data.manual_prices ?? {}) as Record<string, unknown>
    for (const [key, value] of Object.entries(raw)) {
      const num = Number(value)
      if (Number.isFinite(num) && num > 0) prices[key.toUpperCase()] = num
    }
    return {
      buySpread: Number(data.buy_spread ?? BUY_SPREAD),
      sellSpread: Number(data.sell_spread ?? SELL_SPREAD),
      manualUsdNgn:
        data.manual_usd_ngn == null || Number(data.manual_usd_ngn) <= 0
          ? null
          : Number(data.manual_usd_ngn),
      manualPrices: prices,
    }
  } catch (e) {
    console.error('rate settings lookup failed', e)
    return DEFAULT_RATE_SETTINGS
  }
}

/** Prices an order in NGN, USD and asset units, with the desk spread applied. */
export async function quoteOrder(input: {
  asset: string
  side: 'buy' | 'sell'
  amountNgn: number
}): Promise<Quote> {
  const settings = await getRateSettings()
  const manualPrice = settings.manualPrices[input.asset.toUpperCase()] ?? null
  const [liveUsdRate, livePrice] = await Promise.all([
    settings.manualUsdNgn == null ? getUsdNgnRate() : Promise.resolve(settings.manualUsdNgn),
    manualPrice == null ? getAssetUsdPrice(input.asset) : Promise.resolve(manualPrice),
  ])
  const usdRate = liveUsdRate
  const assetPriceUsd = livePrice
  const usdAmount = input.amountNgn / usdRate
  const spread = input.side === 'buy' ? 1 + settings.buySpread : 1 - settings.sellSpread
  const unitPriceNgn = assetPriceUsd == null ? null : assetPriceUsd * usdRate * spread
  const quantity =
    unitPriceNgn == null || unitPriceNgn <= 0 ? null : input.amountNgn / unitPriceNgn
  return {
    asset: input.asset,
    side: input.side,
    amountNgn: input.amountNgn,
    usdRate,
    usdAmount,
    assetPriceUsd,
    unitPriceNgn,
    quantity,
  }
}

