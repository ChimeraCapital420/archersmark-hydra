// api/chat.js — Node function using Supabase SERVICE ROLE so writes never 403.
// Flow: auth user -> load persona -> save user msg -> synthesize reply -> save reply -> return.

const { createClient } = require('@supabase/supabase-js')

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const reqHeaders = req.headers['access-control-request-headers'] || 'authorization,content-type'
  res.setHeader('Access-Control-Allow-Headers', reqHeaders)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Vary', 'Origin')
}

function fail(res, code, stage, detail) {
  const msg = typeof detail === 'string' ? detail : (detail && (detail.message || JSON.stringify(detail))) || ''
  return res.status(code).json({ error: stage, detail: msg })
}

module.exports = async (req, res) => {
  cors(req, res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED')

  if (!SUPA_URL || !SUPA_ANON) return fail(res, 500, 'ENV_SUPABASE_PUBLIC_MISSING')
  if (!SUPA_SERVICE) return fail(res, 500, 'ENV_SERVICE_ROLE_MISSING', 'Add SUPABASE_SERVICE_ROLE_KEY in Vercel')

  try {
    // 1) Verify user from browser token
    const authHeader = req.headers.authorization || ''
    if (!authHeader.toLowerCase().startsWith('bearer '))
      return fail(res, 401, 'AUTH_HEADER_MISSING', 'No login token provided')

    // Client with user token just to read auth user
    const userClient = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user?.id) return fail(res, 401, 'AUTH_GETUSER', userErr)
    const userId = userData.user.id

    // 2) Parse body
    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch (e) { return fail(res, 400, 'BODY_PARSE', e) }
    }
    const userMessage = (body?.message || '').trim()
    const personaName = (body?.personaName || 'Janus').trim()
    const imageUrl = body?.imageUrl || null
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED')

    // 3) Admin client (SERVICE ROLE) for DB writes
    const admin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } })

    // 4) Persona lookup
    const { data: persona, error: pErr } = await admin
      .from('ai_personas')
      .select('id,name,dossier_summary')
      .eq('name', personaName)
      .single()
    if (pErr || !persona?.id) return fail(res, 404, 'PERSONA_LOOKUP', pErr || 'not found')

    // 5) Save user message
    const ins1 = await admin.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'user',
      message_content: userMessage,
      image_url: imageUrl
    })
    if (ins1.error) return fail(res, 500, 'INSERT_USER_MSG', ins1.error)

    // 6) Local in-character reply (no external AI yet)
    const brief = persona.dossier_summary || 'Hydra persona'
    const reply =
      `(${persona.name}) ${brief} — understood. ` +
      `You said: “${userMessage}”. ` +
      `Give me your 1-sentence goal and I’ll propose a plan.`

    // 7) Save AI reply
    const ins2 = await admin.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'ai',
      message_content: reply,
      image_url: null
    })
    if (ins2.error) {
      // Don’t fail the response if logging fails
      console.error('[chat] INSERT_AI_MSG', ins2.error.message)
    }

    return res.status(200).json({ reply, persona: persona.name })
  } catch (e) {
    return fail(res, 500, 'FATAL', e)
  }
}
