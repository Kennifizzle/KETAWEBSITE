import { useEffect, useState } from 'react'
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import { Toaster } from '@/components/ui/sonner'

import { getMyAccess } from '@/lib/admin.functions'
import logo from '@/assets/keta-logo.png'

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminLayout,
})

const tabs: { to: string; label: string; exact?: boolean }[] = [
  { to: '/admin', label: 'Orders', exact: true },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/waitlist', label: 'Waitlist' },
  { to: '/admin/rates', label: 'Rates' },
  { to: '/admin/activity', label: 'Activity' },
]

function AdminLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const access = useServerFn(getMyAccess)
  const [email, setEmail] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['admin-access'], queryFn: () => access({}) })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function signOut() {
    await queryClient.cancelQueries()
    queryClient.clear()
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading the desk…</div>
  }

  if (!data?.role) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border/60 bg-card/60 p-7 text-center">
          <h1 className="font-display text-xl font-bold text-foreground">No desk access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ?? 'This account'} is signed in but has no admin role yet. Ask an existing admin
            to grant access.
          </p>
          <button
            onClick={signOut}
            className="mt-5 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/40"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="KETA" className="h-7 w-auto" />
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              Desk
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {email} · {data.role}
            </span>
            <button
              onClick={signOut}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-muted/40"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-2">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to)
            return (
              <Link
                key={t.to}
                to={t.to as never}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </main>
      <Toaster />

    </div>
  )
}
