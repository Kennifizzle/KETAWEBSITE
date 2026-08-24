import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { getOverview, listOrders, updateOrderStatus } from '@/lib/admin.functions'
import { Empty, Panel, Pill, StatCard, ngn, when } from '@/components/keta/admin-ui'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: AdminOrders,
})

const STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const

function AdminOrders() {
  const queryClient = useQueryClient()
  const overviewFn = useServerFn(getOverview)
  const ordersFn = useServerFn(listOrders)
  const statusFn = useServerFn(updateOrderStatus)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [side, setSide] = useState<'' | 'buy' | 'sell'>('')

  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: () => overviewFn({}) })
  const orders = useQuery({
    queryKey: ['admin-orders', search, status, side],
    queryFn: () =>
      ordersFn({
        data: {
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(side ? { side } : {}),
        },
      }),
  })

  const mutate = useMutation({
    mutationFn: (vars: { reference: string; status: (typeof STATUSES)[number] }) =>
      statusFn({ data: vars }),
    onSuccess: () => {
      toast.success('Order updated')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin-activity'] })
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
  })

  const o = overview.data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Orders" value={o ? String(o.orders) : '—'} hint={o ? `${o.ordersToday} today` : ''} />
        <StatCard label="Pending" value={o ? String(o.pending) : '—'} />
        <StatCard label="Paid" value={o ? String(o.paid) : '—'} />
        <StatCard label="Volume" value={o ? ngn(o.volumeNgn) : '—'} />
        <StatCard label="Waitlist" value={o ? String(o.waitlist) : '—'} hint={o ? `${o.vendors} vendors` : ''} />
      </div>

      <Panel
        title="Orders"
        action={
          <div className="flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, name, email"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            />
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as '' | 'buy' | 'sell')}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">All sides</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {orders.isLoading ? (
          <Empty>Loading orders…</Empty>
        ) : !orders.data?.length ? (
          <Empty>No orders match this filter yet.</Empty>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Payment</th>
                <th className="px-4 py-2">KYC</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.map((row) => (
                <tr key={row.id} className="border-b border-border/40 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{row.reference}</td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{row.fullName}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                    {row.phone ? <div className="text-xs text-muted-foreground">{row.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">
                      {row.side.toUpperCase()} {row.asset}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.kind}
                      {row.network ? ` · ${row.network}` : ''}
                    </div>
                    {row.walletAddress ? (
                      <div className="max-w-[180px] truncate font-mono text-[11px] text-muted-foreground">
                        {row.walletAddress}
                      </div>
                    ) : null}
                    {row.accountNumber ? (
                      <div className="text-[11px] text-muted-foreground">
                        {row.bankName} · {row.accountNumber}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{ngn(row.amount)}</div>
                    {row.usdAmount ? (
                      <div className="text-xs text-muted-foreground">
                        ${row.usdAmount.toFixed(2)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Pill value={row.paymentStatus} />
                    {row.virtualAccountNumber ? (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {row.virtualAccountBank} · {row.virtualAccountNumber}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Pill value={row.verificationStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{when(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      disabled={mutate.isPending}
                      onChange={(e) =>
                        mutate.mutate({
                          reference: row.reference,
                          status: e.target.value as (typeof STATUSES)[number],
                        })
                      }
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
