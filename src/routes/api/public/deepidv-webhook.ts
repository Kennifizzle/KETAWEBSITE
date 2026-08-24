import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'crypto'

/** DeepIDV verification webhook — unblocks the payment step once approved. */
export const Route = createFileRoute('/api/public/deepidv-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['DEEPIDV_WEBHOOK_SECRET']
        const body = await request.text()

        if (secret) {
          const signature =
            request.headers.get('x-deepidv-signature') ?? request.headers.get('x-signature') ?? ''
          const expected = createHmac('sha256', secret).update(body).digest('hex')
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

        const node = payload?.data ?? payload
        const reference: string | undefined = node?.reference ?? node?.metadata?.reference
        const verificationId: string | undefined = node?.id ?? node?.verification_id
        const rawStatus = String(node?.status ?? payload?.event ?? '').toLowerCase()

        if (!reference && !verificationId) {
          return new Response('Missing reference', { status: 400 })
        }

        const status = /approved|verified|success|passed/.test(rawStatus)
          ? 'approved'
          : /reject|fail|declin/.test(rawStatus)
            ? 'rejected'
            : 'pending'

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const query = supabaseAdmin.from('orders').update({
          verification_status: status,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
        })

        const { error } = reference
          ? await query.eq('reference', reference)
          : await query.eq('verification_ref', verificationId!)

        if (error) {
          console.error('deepidv webhook update failed', error)
          return new Response('Update failed', { status: 500 })
        }

        return Response.json({ ok: true })
      },
    },
  },
})
