import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listWaitlist } from '@/lib/admin.functions'
import { Empty, Panel, Pill, when } from '@/components/keta/admin-ui'

export const Route = createFileRoute('/_authenticated/admin/waitlist')({
  component: AdminWaitlist,
})

function AdminWaitlist() {
  const fn = useServerFn(listWaitlist)
  const q = useQuery({ queryKey: ['admin-waitlist'], queryFn: () => fn({}) })

  function exportCsv() {
    const rows = q.data ?? []
    const csv = [
      'kind,name,email,phone,country,note,created_at',
      ...rows.map((r) =>
        [r.kind, r.name, r.email, r.phone ?? '', r.country ?? '', (r.note ?? '').replace(/[",\n]/g, ' '), r.createdAt]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'keta-waitlist.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Panel
      title="Waitlist"
      action={
        <button
          onClick={exportCsv}
          disabled={!q.data?.length}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted/40 disabled:opacity-50"
        >
          Export CSV
        </button>
      }
    >
      {q.isLoading ? (
        <Empty>Loading waitlist…</Empty>
      ) : !q.data?.length ? (
        <Empty>No signups yet.</Empty>
      ) : (
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Contact</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((r) => (
              <tr key={r.id} className="border-b border-border/40 align-top">
                <td className="px-4 py-3">
                  <Pill value={r.kind} />
                </td>
                <td className="px-4 py-3 text-foreground">{r.name}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                  {r.phone ? <div className="text-xs text-muted-foreground">{r.phone}</div> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.country ?? '—'}</td>
                <td className="max-w-[260px] px-4 py-3 text-xs text-muted-foreground">{r.note ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{when(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
