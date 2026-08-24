import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const quoteSchema = z.object({
  asset: z.string().trim().min(1).max(20),
  side: z.enum(['buy', 'sell']),
  amount: z.number().positive().max(100000000),
})

export interface QuoteView {
  asset: string
  side: 'buy' | 'sell'
  amountNgn: number
  usdRate: number
  usdAmount: number
  assetPriceUsd: number | null
  unitPriceNgn: number | null
  quantity: number | null
}

/** Live indicative rate for a crypto order, spread included. */
export const getQuote = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }): Promise<QuoteView> => {
    const { quoteOrder } = await import('@/lib/payments.server')
    return quoteOrder({ asset: data.asset, side: data.side, amountNgn: data.amount })
  })
