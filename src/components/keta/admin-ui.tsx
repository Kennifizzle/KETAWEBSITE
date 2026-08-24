import type { ReactNode } from 'react'

export const ngn = (value: number) =>
  '₦' + Math.round(value).toLocaleString('en-NG')

export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {action}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

const tone: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  processing: 'bg-sky-500/15 text-sky-400',
  completed: 'bg-primary/15 text-primary',
  paid: 'bg-primary/15 text-primary',
  cancelled: 'bg-destructive/15 text-destructive',
  bvn_rejected: 'bg-destructive/15 text-destructive',
  verified: 'bg-primary/15 text-primary',
  error: 'bg-destructive/15 text-destructive',
  warn: 'bg-amber-500/15 text-amber-400',
}

export function Pill({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        tone[value] ?? 'bg-muted/50 text-muted-foreground'
      }`}
    >
      {value.replace(/_/g, ' ')}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>
}
