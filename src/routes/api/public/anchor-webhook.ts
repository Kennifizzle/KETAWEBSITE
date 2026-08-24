import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Anchor payment webhook. Marks an order paid when the dedicated virtual
 * account receives the transfer.
 */
export const Route = createFileRoute('/api/public/anchor-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['ANCHOR_WEBHOOK_SECRET']
        const body = await request.text()

        if (secret) {
          const signature = request.headers.get('x-anchor-signature') ?? ''
          const expected = createHmac('sha1', secret).update(body).digest('base64')
          const a = Buffer.from(signature)
          const b = Buffer.from(expected)
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response('Invalid signature', { status: 401 })
          }
        }

        let payload: any
        try {
          payload = JSON.parse(body)
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const attrs = payload?.data?.attributes ?? payload?.data ?? payload
        const eventType: string = payload?.data?.type ?? payload?.event ?? ''
        const accountNumber: string | undefined =
          attrs?.virtualNuban?.accountNumber ??
          attrs?.destinationAccount?.accountNumber ??
          attrs?.accountNumber
        const paymentRef: string | undefined =
          payload?.data?.relationships?.virtualNuban?.data?.id ?? attrs?.reference

        const isCredit =
          /payment|nip\.?inbound|credit|deposit/i.test(String(eventType)) ||
          attrs?.type === 'CREDIT'

        if (!isCredit || (!accountNumber && !paymentRef)) {
          return Response.json({ ok: true, ignored: true })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const query = supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })

        const { error } = accountNumber
          ? await query.eq('virtual_account_number', accountNumber)
          : await query.eq('payment_provider_ref', paymentRef!)

        if (error) {
          console.error('anchor webhook update failed', error)
          return new Response('Update failed', { status: 500 })
        }

        return Response.json({ ok: true })
      },
    },
  },
})
