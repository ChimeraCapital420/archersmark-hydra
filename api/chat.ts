// api/chat.ts — server brain with CORS so localhost can call Vercel
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const OPENAI_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// Allow localhost during dev (and any origin unless you set CORS_ORIGIN)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

function setCORS(res: any) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
}

const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null

export default async function handler(req: any, res: any) {
  setCORS(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Use POST' })
  }

  try {
    // 1) Auth from browser (must be signed in)
    const authHeader = req.headers.authorization || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'No login token provided' })
    }
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Supabase env vars missing on server' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
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

    // 3) Persona
    const { data: persona, error: personaErr } = await supabase
      .from('ai_personas')
      .select('id,name,dossier_summary')
      .eq('name', personaName)
      .single()
    if (personaErr || !persona?.id) {
      return res.status(404).json({ error: `Persona '${personaName}' not found` })
    }

    // 4) Save the user's message (RLS ensures it’s your row)
    {
      const { error } = await supabase.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'user',
        message_content: userMessage,
        image_url: imageUrl
      })
      if (error) {
        return res.status(403).json({
          error: 'Failed to save user message (permissions)',
          detail: error.message
        })
      }
    }

    // 5) Model reply (fallback if no key)
    let reply = ''
    if (!openai) {
      reply = `Hydra brain: OpenAI key not set on server. Echo: ${userMessage}`
    } else {
      const system = `You are ${persona.name}, an AI persona in the Hydra Engine.
Brief: ${persona.dossier_summary ?? 'No brief.'}
Be concise and stay in character.`
      try {
        const chat = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.6
        })
        reply =
          chat.choices?.[0]?.message?.content?.trim() ||
          'Thinking… (no content returned).'
      } catch (e: any) {
        return res.status(502).json({
          error: 'Model call failed',
          detail: e?.message || 'unknown error'
        })
      }
    }

    // 6) Save AI reply (best-effort)
    {
      const { error } = await supabase.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'ai',
        message_content: reply,
        image_url: null
      })
      if (error) console.error('[api/chat] failed to save ai reply:', error.message)
    }

    return res.status(200).json({ reply, persona: persona.name })
  } catch (err: any) {
    console.error('[api/chat] error', err)
    return res.status(500).json({ error: 'Server error', detail: err?.message || '' })
  }
}
