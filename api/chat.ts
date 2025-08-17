// api/chat.ts — uses Supabase SERVICE ROLE (admin) so no RLS headaches.
// Flow: auth user (with their token) → read persona → save user msg → synthesize reply → save reply → return.

import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string

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

  // 0) Check env
  if (!SUPA_URL || !SUPA_ANON) return fail(res, 500, 'ENV_SUPABASE_PUBLIC_MISSING')
  if (!SUPA_SERVICE) return fail(res, 500, 'ENV_SERVICE_ROLE_MISSING', 'Add SUPABASE_SERVICE_ROLE_KEY in Vercel')

  try {
    // 1) Verify user from browser token (must be signed in)
    const authHeader = req.headers.authorization || ''
    if (!authHeader.toLowerCase().startsWith('bearer '))
      return fail(res, 401, 'AUTH_HEADER_MISSING', 'No login token provided')

    // client for auth only (uses user’s token)
    const userClient = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user?.id) return fail(res, 401, 'AUTH_GETUSER', userErr)
    const userId = userData.user.id

    // 2) Parse body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const userMessage = (body?.message ?? '').trim()
    const personaName = (body?.personaName ?? 'Janus').trim()
    const imageUrl = body?.imageUrl ?? null
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED')

    // 3) Admin client (SERVICE ROLE) ignores RLS so writes never 403
    const admin = createClient(SUPA_URL, SUPA_SERVICE)

    // 4) Persona lookup (admin)
    const { data: persona, error: personaErr } = await admin
      .from('ai_personas')
      .select('id,name,dossier_summary')
      .eq('name', personaName)
      .single()
    if (personaErr || !persona?.id) return fail(res, 404, 'PERSONA_LOOKUP', personaErr || 'not found')

    // 5) Save user message (admin insert)
    {
      const { error } = await admin.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'user',
        message_content: userMessage,
        image_url: imageUrl,
      })
      if (error) return fail(res, 500, 'INSERT_USER_MSG', error)
    }

    // 6) Local “smart” reply (no external AI yet)
    const brief = persona.dossier_summary || 'Hydra persona'
    const reply =
      `(${persona.name}) ${brief} — understood. ` +
      `You said: “${userMessage}”. ` +
      `Give me your 1-sentence goal and I’ll propose a plan.`

    // 7) Save AI reply (admin insert)
    {
      const { error } = await admin.from('conversation_history').insert({
        user_id: userId,
        persona_id: persona.id,
        sender: 'ai',
        message_content: reply,
        image_url: null,
      })
      if (error) {
        // Don’t fail the response if logging fails
        console.error('[chat] INSERT_AI_MSG', error.message)
      }
    }

    return res.status(200).json({ reply, persona: persona.name })
  } catch (e: any) {
    return fail(res, 500, 'FATAL', e)
  }
}
