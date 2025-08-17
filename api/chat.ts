// api/chat.ts — stage-by-stage errors so we can see EXACTLY what's wrong
import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
function setCORS(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  const reqHeaders = req.headers['access-control-request-headers'] || 'authorization,content-type'
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Vary', 'Origin')
}

function fail(res: any, code: number, stage: string, detail?: any) {
  const msg = typeof detail === 'string' ? detail : (detail?.message || detail || '')
  return res.status(code).json({ error: stage, detail: msg })
}

export default async function handler(req: any, res: any) {
  setCORS(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED')

  // 0) ENV present?
  if (!SUPA_URL || !SUPA_ANON) {
    return fail(res, 500, 'ENV_SUPABASE_MISSING', 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel')
  }

  try {
    // 1) Auth from browser
    const authHeader = req.headers.authorization || ''
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return fail(res, 401, 'AUTH_HEADER_MISSING', 'No login token provided')
    }

    // 2) Supabase client with user token
    let supabase
    try {
      supabase = createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: authHeader } } })
    } catch (e: any) {
      return fail(res, 500, 'SUPABASE_CLIENT_INIT', e)
    }

    // 3) Get user id
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) return fail(res, 401, 'AUTH_GETUSER', error)
      if (!data?.user?.id) return fail(res, 401, 'AUTH_NO_USER')
    } catch (e: any) {
      return fail(res, 500, 'AUTH_GETUSER_THROW', e)
    }
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData!.user!.id

    // 4) Body parse
    let body: any = req.body
    try {
      if (typeof body === 'string') body = JSON.parse(body)
    } catch (e: any) {
      return fail(res, 400, 'BODY_PARSE', e)
    }
    const userMessage = (body?.message ?? '').trim()
    const personaName = (body?.personaName ?? 'Janus').trim()
    const imageUrl = body?.imageUrl ?? null
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED')

    // 5) Persona lookup
    let persona
    try {
      const { data, error } = await supabase
        .from('ai_personas')
        .select('id,name,dossier_summary')
        .eq('name', personaName)
        .single()
      if (error || !data) return fail(res, 404, 'PERSONA_LOOKUP', error || 'not found')
      persona = data
    } catch (e: any) {
      return fail(res, 500, 'PERSONA_LOOKUP_THROW', e)
    }

    // 6) Save user message
    try {
      const { error } = await supabase.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'user',
        message_content: userMessage,
        image_url: imageUrl
      })
      if (error) return fail(res, 403, 'INSERT_USER_MSG', error)
    } catch (e: any) {
      return fail(res, 500, 'INSERT_USER_MSG_THROW', e)
    }

    // 7) Create a simple in-character reply (no external model)
    const brief = persona.dossier_summary || 'Hydra persona'
    const reply =
      `(${persona.name}) ${brief} — acknowledged. ` +
      `You said: “${userMessage}”. ` +
      `Next step: state your goal in one sentence; I’ll propose a plan.`

    // 8) Save AI reply (best effort)
    try {
      const { error } = await supabase.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'ai',
        message_content: reply,
        image_url: null
      })
      if (error) {
        // Log but don’t fail the response
        console.error('[chat] INSERT_AI_MSG', error.message)
      }
    } catch (e: any) {
      console.error('[chat] INSERT_AI_MSG_THROW', e?.message || e)
    }

    // 9) Done
    return res.status(200).json({ reply, persona: persona.name })
  } catch (e: any) {
    return fail(res, 500, 'FATAL', e)
  }
}
