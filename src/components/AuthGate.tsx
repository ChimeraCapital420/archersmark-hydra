// src/components/AuthGate.tsx
import { useEffect, useState } from 'react'
// ✅ Use a relative path instead of "@/lib/..."
import { supabase } from '../lib/supabaseClient'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  if (!ready) return null
  if (!authed) return <AuthPanel />
  return <>{children}</>
}

function AuthPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null); setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Check your email to confirm, then come back and Sign In.')
      }
    } catch (e: any) {
      setErr(e.message || 'Auth error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl">
        <h1 className="text-xl font-semibold">Hydra Access</h1>

        <input
          className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
        />

        <button
          disabled={busy}
          className="w-full py-2 rounded bg-[#00BFFF] text-black font-semibold disabled:opacity-60"
        >
          {mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>

        <div className="text-sm text-zinc-400">
          {mode === 'signin' ? (
            <span>
              Need an account?{' '}
              <button
                type="button"
                onClick={()=>setMode('signup')}
                className="text-[#D900FF]"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Have an account?{' '}
              <button
                type="button"
                onClick={()=>setMode('signin')}
                className="text-[#D900FF]"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {err && <div className="text-red-400 text-sm">{err}</div>}
        {msg && <div className="text-green-400 text-sm">{msg}</div>}
      </form>
    </div>
  )
}
