// src/lib/hydraApi.ts — call local /api/chat on Vercel, or Vercel URL from localhost
import { supabase } from './supabaseClient'

// If you set VITE_API_BASE in .env we’ll use it.
// Otherwise, if you’re on localhost we call your Vercel URL.
const DEFAULT_VERCEL = 'https://archersmark-billy-ai-team.vercel.app' // <-- your deployed site
const apiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (window.location.hostname === 'localhost' ? DEFAULT_VERCEL : '')

export async function sendChat(
  message: string,
  personaName: string = 'Janus',
  imageUrl?: string | null
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not signed in')

  const url = `${apiBase}/api/chat` // apiBase = '' on Vercel, full URL on localhost
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ message, personaName, imageUrl: imageUrl ?? null })
  })

  if (!res.ok) {
    let msg = 'Request failed'
    try {
      const data = await res.json()
      msg = data?.error ? `${data.error}${data.detail ? ` — ${data.detail}` : ''}` : msg
    } catch {
      const text = await res.text().catch(() => '')
      if (text) msg = text
    }
    throw new Error(msg)
  }

  return res.json() as Promise<{ reply: string; persona: string }>
}
