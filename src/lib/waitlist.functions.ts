import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const waitlistSchema = z.object({
  kind: z.enum(['trader', 'vendor']),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
})

export const submitWaitlist = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => waitlistSchema.parse(data))
  .handler(async ({ data }) => {
    // Server-side, input already validated. Admin client is used so we can read
    // back the inserted row (the table has no public SELECT policy).
    const { supabaseAdmin: supabase } = await import('@/integrations/supabase/client.server')


    const { data: inserted, error } = await supabase
      .from('waitlist_signups')
      .insert({
        kind: data.kind,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        country: data.country || null,
        note: data.note || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('waitlist insert failed', error)
      throw new Error('Could not submit right now')
    }

    const id = inserted?.id ?? data.email

    try {
      const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
      await sendTemplateEmail('waitlist-confirmation', data.email, {
        templateData: { name: data.name, kind: data.kind },
        idempotencyKey: `waitlist-confirmation-${id}`,
        replyTo: 'KETAEXCHANGE@GMAIL.COM',
      })
      await sendTemplateEmail('waitlist-notification', 'KETAEXCHANGE@GMAIL.COM', {
        templateData: {
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          country: data.country || '',
          note: data.note || '',
          kind: data.kind,
        },
        idempotencyKey: `waitlist-notification-${id}`,
        replyTo: data.email,
      })
    } catch (emailError) {
      // Signup is saved regardless — email delivery issues must not fail the form.
      console.error('waitlist email send failed', emailError)
    }

    return { ok: true as const }
  })
