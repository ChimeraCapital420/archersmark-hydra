// src/lib/hydraApi.ts — show precise HTTP error so we know what's wrong
import { supabase } from './supabaseClient'

export async function sendChat(
  message: string,
  personaName: string = 'Janus',
  imageUrl?: string | null
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not signed in')

  const url = `/api/chat` // same-site call on your live Vercel site

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message, personaName, imageUrl: imageUrl ?? null }),
    })
  } catch {
    throw new Error('Network error (could not reach /api/chat)')
  }

  if (!res.ok) {
    // Start with status code for clarity
    let msg = `HTTP ${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data?.error) msg += ` — ${data.error}${data.detail ? ` (${data.detail})` : ''}`
    } catch {
      const text = await res.text().catch(() => '')
      if (text) msg += ` — ${text.slice(0, 200)}`
    }
    throw new Error(msg)
  }

  return res.json() as Promise<{ reply: string; persona: string }>
}
