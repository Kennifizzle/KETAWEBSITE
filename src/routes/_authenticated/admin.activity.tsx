import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { listActivity } from '@/lib/admin.functions'
import { Empty, Panel, Pill, when } from '@/components/keta/admin-ui'

export const Route = createFileRoute('/_authenticated/admin/activity')({
  component: AdminActivity,
})

function AdminActivity() {
  const fn = useServerFn(listActivity)
  const q = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => fn({}),
    refetchInterval: 30_000,
  })

  return (
    <Panel title="Backend activity">
      {q.isLoading ? (
        <Empty>Loading activity…</Empty>
      ) : !q.data?.length ? (
        <Empty>Nothing logged yet. Orders, payments and rate changes appear here.</Empty>
      ) : (
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Event</th>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((a) => (
              <tr key={a.id} className="border-b border-border/40 align-top">
                <td className="px-4 py-3 text-xs text-muted-foreground">{when(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{a.event}</div>
                  <Pill value={a.level} />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-primary">{a.reference ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{a.actor ?? 'system'}</td>
                <td className="max-w-[320px] px-4 py-3 text-xs text-muted-foreground">
                  <div>{a.message ?? '—'}</div>
                  {a.meta && a.meta !== '{}' ? (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] opacity-70">
                      {a.meta}
                    </pre>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
