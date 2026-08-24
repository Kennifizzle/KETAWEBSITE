import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { TRACKED_ASSET_LIST, getRates, updateRates } from '@/lib/admin.functions'
import { Panel, StatCard, when } from '@/components/keta/admin-ui'

export const Route = createFileRoute('/_authenticated/admin/rates')({
  component: AdminRates,
})

function AdminRates() {
  const queryClient = useQueryClient()
  const ratesFn = useServerFn(getRates)
  const saveFn = useServerFn(updateRates)
  const q = useQuery({ queryKey: ['admin-rates'], queryFn: () => ratesFn({}), refetchInterval: 60_000 })

  const [buySpread, setBuySpread] = useState('2.5')
  const [sellSpread, setSellSpread] = useState('2.5')
  const [manualUsd, setManualUsd] = useState('')
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!q.data) return
    setBuySpread((q.data.buySpread * 100).toFixed(2))
    setSellSpread((q.data.sellSpread * 100).toFixed(2))
    setManualUsd(q.data.manualUsdNgn ? String(q.data.manualUsdNgn) : '')
    const next: Record<string, string> = {}
    for (const asset of TRACKED_ASSET_LIST) {
      const pinned = q.data.manualPrices[asset]
      next[asset] = pinned ? String(pinned) : ''
    }
    setManualPrices(next)
  }, [q.data])

  const save = useMutation({
    mutationFn: () => {
      const prices: Record<string, number> = {}
      for (const [asset, value] of Object.entries(manualPrices)) {
        const num = Number(value)
        if (value.trim() !== '' && Number.isFinite(num) && num > 0) prices[asset] = num
      }
      return saveFn({
        data: {
          buySpread: Number(buySpread) / 100,
          sellSpread: Number(sellSpread) / 100,
          manualUsdNgn: manualUsd.trim() === '' ? null : Number(manualUsd),
          manualPrices: prices,
        },
      })
    },
    onSuccess: () => {
      toast.success('Rates updated — live on the site now')
      queryClient.invalidateQueries({ queryKey: ['admin-rates'] })
      queryClient.invalidateQueries({ queryKey: ['admin-activity'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not save rates'),
  })

  const d = q.data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Live USD/NGN" value={d ? '₦' + d.liveUsdNgn.toFixed(2) : '—'} />
        <StatCard
          label="Effective USD/NGN"
          value={d ? '₦' + (d.manualUsdNgn ?? d.liveUsdNgn).toFixed(2) : '—'}
          hint={d?.manualUsdNgn ? 'pinned manually' : 'live feed'}
        />
        <StatCard label="Buy spread" value={d ? (d.buySpread * 100).toFixed(2) + '%' : '—'} />
        <StatCard label="Sell spread" value={d ? (d.sellSpread * 100).toFixed(2) + '%' : '—'} />
      </div>

      <Panel title="Desk controls" action={<span className="text-xs text-muted-foreground">Last change {when(d?.updatedAt ?? null)}</span>}>
        <div className="space-y-6 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Buy spread (%)" value={buySpread} onChange={setBuySpread} />
            <Field label="Sell spread (%)" value={sellSpread} onChange={setSellSpread} />
            <Field
              label="Pin USD/NGN (blank = live)"
              value={manualUsd}
              onChange={setManualUsd}
              placeholder={d ? d.liveUsdNgn.toFixed(2) : ''}
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Pin asset prices in USD (blank = live market price)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TRACKED_ASSET_LIST.map((asset) => (
                <Field
                  key={asset}
                  label={asset}
                  value={manualPrices[asset] ?? ''}
                  onChange={(v) => setManualPrices((prev) => ({ ...prev, [asset]: v }))}
                  placeholder={
                    d?.livePrices[asset] != null ? String(d.livePrices[asset]) : 'live'
                  }
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-lg bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save rates'}
          </button>
        </div>
      </Panel>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  )
}
