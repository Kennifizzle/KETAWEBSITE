import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import {
  getMyAccess,
  getRolesForEmails,
  listCustomers,
  setUserRole,
} from '@/lib/admin.functions'
import { Empty, Panel, ngn, when } from '@/components/keta/admin-ui'

export const Route = createFileRoute('/_authenticated/admin/customers')({
  component: AdminCustomers,
})

function AdminCustomers() {
  const queryClient = useQueryClient()
  const fn = useServerFn(listCustomers)
  const accessFn = useServerFn(getMyAccess)
  const rolesFn = useServerFn(getRolesForEmails)
  const setRoleFn = useServerFn(setUserRole)

  const q = useQuery({ queryKey: ['admin-customers'], queryFn: () => fn({}) })
  const access = useQuery({ queryKey: ['admin-access'], queryFn: () => accessFn({}) })
  const isAdmin = access.data?.role === 'admin'

  const emails = (q.data ?? []).map((c) => c.email)
  const roles = useQuery({
    queryKey: ['admin-customer-roles', emails],
    enabled: isAdmin && emails.length > 0,
    queryFn: () => rolesFn({ data: { emails } }),
  })
  const roleByEmail = new Map(
    (roles.data ?? []).map((r) => [r.email.toLowerCase(), r] as const),
  )

  const mutate = useMutation({
    mutationFn: (vars: { email: string; role: 'admin' | 'staff' | null }) =>
      setRoleFn({ data: vars }),
    onSuccess: (_res, vars) => {
      toast.success(
        vars.role ? `${vars.email} is now ${vars.role}` : `Access removed for ${vars.email}`,
      )
      queryClient.invalidateQueries({ queryKey: ['admin-customer-roles'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Panel title="Customers">
      {q.isLoading ? (
        <Empty>Loading customers…</Empty>
      ) : !q.data?.length ? (
        <Empty>No customers yet — they appear here after their first order.</Empty>
      ) : (
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Volume</th>
              <th className="px-4 py-2">Verified</th>
              <th className="px-4 py-2">Last order</th>
              {isAdmin ? <th className="px-4 py-2">Desk access</th> : null}
            </tr>
          </thead>
          <tbody>
            {q.data.map((c) => {
              const row = roleByEmail.get(c.email.toLowerCase())
              const busy = mutate.isPending && mutate.variables?.email === c.email
              return (
                <tr key={c.email} className="border-b border-border/40">
                  <td className="px-4 py-3">
                    <div className="text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground">{c.orders}</td>
                  <td className="px-4 py-3 text-foreground">{ngn(c.volumeNgn)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.verified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{when(c.lastOrderAt)}</td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      {roles.isLoading ? (
                        <span className="text-xs text-muted-foreground">…</span>
                      ) : !row?.hasAccount ? (
                        <span className="text-xs text-muted-foreground">No account</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={row.role ?? ''}
                            disabled={busy}
                            onChange={(e) =>
                              mutate.mutate({
                                email: c.email,
                                role: (e.target.value || null) as 'admin' | 'staff' | null,
                              })
                            }
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground disabled:opacity-50"
                          >
                            <option value="">No access</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          {busy ? (
                            <span className="text-xs text-muted-foreground">Saving…</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
