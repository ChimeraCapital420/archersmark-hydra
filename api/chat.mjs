import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

function fail(res, code, stage, detail) {
  const msg =
    typeof detail === 'string'
      ? detail
      : detail && (detail.message || JSON.stringify(detail));
  return res.status(code).json({ error: stage, detail: msg || '' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'authorization,content-type'
  );
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  // --- Environment Variable Check ---
  if (!SUPA_URL || !SUPA_ANON)
    return fail(res, 500, 'ENV_SUPABASE_PUBLIC_MISSING');
  if (!SUPA_SERVICE)
    return fail(
      res,
      500,
      'ENV_SERVICE_ROLE_MISSING',
      'Add SUPABASE_SERVICE_ROLE_KEY in Vercel'
    );
  if (!OPENAI_API_KEY)
    return fail(res, 500, 'ENV_OPENAI_API_KEY_MISSING');

  try {
    const admin = createClient(SUPA_URL, SUPA_SERVICE, {
      auth: { persistSession: false },
    });

    // --- User Auth and Body Parsing ---
    const authHeader = req.headers.authorization || '';
    if (!authHeader.toLowerCase().startsWith('bearer '))
      return fail(res, 401, 'AUTH_HEADER_MISSING', 'No login token provided');

    const userClient = createClient(SUPA_URL, SUPA_ANON, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.id) return fail(res, 401, 'AUTH_GETUSER', userErr);
    const userId = user.id;

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { return fail(res, 400, 'BODY_PARSE', e); }
    }
    const userMessage = (body?.message || '').trim();
    const personaName = (body?.personaName || 'Janus').trim();
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED');

    // --- Persona and History Lookup ---
    const { data: persona, error: pErr } = await admin
      .from('ai_personas')
      .select('id, name, dossier_summary, key_attributes')
      .eq('name', personaName)
      .single();
    if (pErr || !persona?.id) return fail(res, 404, 'PERSONA_LOOKUP', pErr);

    const { data: history, error: hErr } = await admin
      .from('conversation_history')
      .select('sender, message_content')
      .eq('user_id', userId)
      .eq('persona_id', persona.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (hErr) return fail(res, 500, 'HISTORY_LOOKUP', hErr);

    // --- Save User Message ---
    const { error: insErr } = await admin.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'user',
      message_content: userMessage,
    });
    if (insErr) return fail(res, 500, 'INSERT_USER_MSG', insErr);

    // --- Call OpenAI for a response ---
    const systemPrompt = `You are ${persona.name}, a core persona of the Hydra Engine. Your role is: "${persona.role}".
Your core attributes are: ${persona.key_attributes}.
Your operational summary is: "${persona.dossier_summary}".
You must respond as this persona. Be direct, intelligent, and stay in character. Do not break character or mention you are an AI.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.reverse().map(h => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.message_content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiReply = completion.choices[0].message.content.trim();

    // --- Save AI Reply ---
    await admin.from('conversation_history').insert({
      user_id: userId,
      persona_id: persona.id,
      sender: 'ai',
      message_content: aiReply,
    });

    return res.status(200).json({ reply: aiReply, persona: persona.name });
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'FATAL', e);
  }
}