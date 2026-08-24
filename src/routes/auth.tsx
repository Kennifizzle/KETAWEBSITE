import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { lovable } from '@/integrations/lovable/index'
import { toast } from 'sonner'
import logo from '@/assets/keta-logo.png'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Desk sign in — KETA' },
      { name: 'description', content: 'Sign in to the KETA desk backend to manage orders, rates and activity.' },
      { name: 'robots', content: 'noindex' },
      { property: 'og:title', content: 'Desk sign in — KETA' },
      { property: 'og:description', content: 'KETA staff access to the trading desk backend.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: '/admin', replace: true })
    })
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/admin' },
        })
        if (error) throw error
        toast.success('Check your email to confirm the account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate({ to: '/admin', replace: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/auth',
    })
    if (result.error) {
      toast.error('Google sign-in failed')
      return
    }
    if (result.redirected) return
    navigate({ to: '/admin', replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60 p-7 backdrop-blur">
        <img src={logo} alt="KETA" className="mb-6 h-8 w-auto" />
        <span className="font-bold text-lg">KETA</span>
        <h1 className="font-display text-2xl font-bold text-foreground">Desk backend</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff access only. Orders, rates, waitlist and activity.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@keta.ltd"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={google}
          className="mt-3 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  )
}
