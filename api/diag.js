// api/diag.js — shows what’s missing in plain English (no secrets)
const { createClient } = require('@supabase/supabase-js')

module.exports = async (req, res) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'

  let canSelectPersonas = false
  let personasCount = null
  let selectError = null

  if (url && anon === 'present') {
    try {
      const supa = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { error, count } = await supa
        .from('ai_personas')
        .select('id', { head: true, count: 'exact' })
      if (error) selectError = error.message
      else { canSelectPersonas = true; personasCount = count ?? null }
    } catch (e) {
      selectError = e.message || 'unknown select error'
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })

  return res.status(200).json({
    ok: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
    },
    supabase_read_ai_personas: {
      canSelectPersonas, personasCount, selectError
    }
  })
}
