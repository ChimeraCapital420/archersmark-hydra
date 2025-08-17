// api/chat.ts — Vercel Serverless Function
// Receives { message, personaName?, imageUrl? }, verifies Supabase auth,
// pulls context, asks OpenAI (MVP), saves memory, returns reply.

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // --- Auth (Supabase session token from the browser) ---
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: userResult, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userResult?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const user = userResult.user

    // --- Input body ---
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const userMessage = (body?.message ?? '').trim()
    const personaName = (body?.personaName ?? 'Janus').trim()
    const imageUrl = body?.imageUrl ?? null

    if (!userMessage) {
      return res.status(400).json({ error: 'Message required' })
    }

    // --- Persona lookup ---
    const { data: persona, error: personaErr } = await supabase
      .from('ai_personas')
      .select('id, name, dossier_summary')
      .eq('name', personaName)
      .single()

    if (personaErr || !persona) {
      return res.status(404).json({ error: `Persona '${personaName}' not found` })
    }

    // --- Pull last 20 messages for context (RLS keeps user safe) ---
    const { data: historyRows } = await supabase
      .from('conversation_history')
      .select('sender, message_content, image_url, created_at')
      .eq('user_id', user.id)
      .eq('persona_id', persona.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const history = (historyRows ?? []).reverse()

    // --- System + prior messages ---
    const system = `You are ${persona.name}, an AI persona in the Hydra Engine.
Persona brief: ${persona.dossier_summary ?? 'No brief provided.'}
Follow the brief’s tone and priorities. Be concise and directive.`

    const prior = history.flatMap((h) =>
      h.sender === 'user'
        ? [{ role: 'user' as const, content: h.message_content }]
        : [{ role: 'assistant' as const, content: h.message_content }]
    )

    // --- Save the user's message first (durable log) ---
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      persona_id: persona.id,
      sender: 'user',
      message_content: userMessage,
      image_url: imageUrl
    })

    // --- MVP model call (OpenAI only for now) ---
    const chat = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        ...prior,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.6
    })

    const reply =
      chat.choices?.[0]?.message?.content?.trim() ||
      'Thinking… (no content returned).'

    // --- Save AI reply ---
    await supabase.from('conversation_history').insert({
      user_id: user.id,
      persona_id: persona.id,
      sender: 'ai',
      message_content: reply,
      image_url: null
    })

    return res.status(200).json({ reply, persona: persona.name })
  } catch (err: any) {
    console.error('[api/chat] error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
