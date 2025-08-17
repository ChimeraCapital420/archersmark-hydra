// api/chat.ts — safe fallback: no external AI calls (no 500s)
// Auth -> load persona -> save user msg -> synthesize reply -> save reply -> return

import { createClient } from '@supabase/supabase-js'

// Env (must be set in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// CORS (lets you call this from your live site; tighten later if you want)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
function setCORS(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  const reqHeaders = req.headers['access-control-request-headers'] || 'authorization,content-type'
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Vary', 'Origin')
}

export default async function handler(req: any, res: any) {
  setCORS(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Use POST' })
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase env vars missing on server' })
    }

    // 1) Auth from browser
    const authHeader = req.headers.authorization || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'No login token provided' })
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ error: 'Not signed in' })
    }
    const userId = userData.user.id

    // 2) Input
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const userMessage = (body?.message ?? '').trim()
    const personaName = (body?.personaName ?? 'Janus').trim()
    const imageUrl = body?.imageUrl ?? null
    if (!userMessage) return res.status(400).json({ error: 'Message required' })

    // 3) Persona (load brief to shape the voice)
    const { data: persona, error: personaErr } = await supabase
      .from('ai_personas')
      .select('id,name,dossier_summary')
      .eq('name', personaName)
      .single()
    if (personaErr || !persona?.id) {
      return res.status(404).json({ error: `Persona '${personaName}' not found` })
    }

    // 4) Save the user message
    const insUser = await supabase.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'user',
      message_content: userMessage,
      image_url: imageUrl,
    })
    if (insUser.error) {
      return res.status(403).json({
        error: 'Failed to save user message (permissions)',
        detail: insUser.error.message,
      })
    }

    // 5) Synthesize a reply (no external AI; persona-flavored)
    const brief = persona.dossier_summary || 'Hydra persona'
    const reply =
      `(${persona.name}) ${brief} — got it. ` +
      `You said: “${userMessage}”. ` +
      `Here’s a next step: summarize your objective in one sentence, ` +
      `then ask me for a checklist or draft so I can execute.`

    // 6) Save the AI reply (best-effort)
    await supabase.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'ai',
      message_content: reply,
      image_url: null,
    })

    // 7) Return to the client
    return res.status(200).json({ reply, persona: persona.name })
  } catch (err: any) {
    console.error('[api/chat] fatal', err)
    return res.status(500).json({ error: 'Server error', detail: err?.message || '' })
  }
}
