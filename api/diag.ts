// api/diag.ts — shows what's missing in plain English (no secrets)
import { createClient } from '@supabase/supabase-js'

export default async function handler(_req: any, res: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'

  // Try reading ai_personas as ANON (no login)
  let canSelectPersonas = false
  let personasCount: number | null = null
  let selectError: string | null = null

  if (url && anon === 'present') {
    try {
      const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
      const { data, error, count } = await supabase
        .from('ai_personas')
        .select('id', { count: 'exact', head: true })
      if (error) {
        selectError = error.message
      } else {
        canSelectPersonas = true
        personasCount = count ?? null
      }
    } catch (e: any) {
      selectError = e?.message || 'unknown select error'
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (_req.method === 'OPTIONS') return res.status(200).end()
  if (_req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  return res.status(200).json({
    ok: true,
    note: "This is a safe status check — no secrets in this response.",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    },
    supabase_read_ai_personas: {
      canSelectPersonas,
      personasCount,
      selectError,
    }
  })
}
