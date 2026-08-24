// Server-only backend activity recorder. Never import from client components.

export interface ActivityEntry {
  event: string
  level?: 'info' | 'warn' | 'error'
  reference?: string | null
  actor?: string | null
  message?: string | null
  meta?: Record<string, unknown>
}

/** Writes a backend event to the admin activity log. Never throws. */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    await supabaseAdmin.from('activity_log').insert({
      event: entry.event,
      level: entry.level ?? 'info',
      reference: entry.reference ?? null,
      actor: entry.actor ?? 'system',
      message: entry.message ?? null,
      meta: (entry.meta ?? {}) as never,
    })
  } catch (e) {
    console.error('activity log write failed', e)
  }
}
