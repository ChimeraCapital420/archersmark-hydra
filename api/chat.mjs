import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// --- Environment Variable Setup ---
const {
  NEXT_PUBLIC_SUPABASE_URL: SUPA_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPA_ANON,
  SUPABASE_SERVICE_ROLE_KEY: SUPA_SERVICE,
  OPENAI_API_KEY,
  CLAUDE_API_KEY,
  GEMINI_API_KEY,
  GROK_API_KEY,
  DEEPSEEK_API_KEY,
} = process.env;

// --- Initialize API Clients ---
const llm_providers = [];
if (OPENAI_API_KEY) llm_providers.push({ name: 'OpenAI', client: new OpenAI({ apiKey: OPENAI_API_KEY }) });
if (CLAUDE_API_KEY) llm_providers.push({ name: 'Claude', client: new Anthropic({ apiKey: CLAUDE_API_KEY }) });
if (GEMINI_API_KEY) llm_providers.push({ name: 'Gemini', client: new GoogleGenerativeAI(GEMINI_API_KEY) });
if (GROK_API_KEY) llm_providers.push({ name: 'Grok', client: new Groq({ apiKey: GROK_API_KEY }) });
if (DEEPSEEK_API_KEY) llm_providers.push({ name: 'DeepSeek', client: new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com/v1" }) });


// --- Helper Functions ---
function fail(res, code, stage, detail) {
  const msg = typeof detail === 'string' ? detail : (detail && (detail.message || JSON.stringify(detail)));
  return res.status(code).json({ error: stage, detail: msg || '' });
}

// --- Main Handler ---
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  if (llm_providers.length === 0) return fail(res, 500, 'ENV_LLM_KEYS_MISSING', 'No AI provider API keys found');

  try {
    const admin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });

    // --- User Auth & Body Parsing ---
    const authHeader = req.headers.authorization || '';
    const userClient = createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.id) return fail(res, 401, 'AUTH_GETUSER', userErr);
    const userId = user.id;

    const body = req.body;
    const userMessage = (body?.message || '').trim();
    const personaName = (body?.personaName || 'Janus').trim();
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED');

    // --- Persona & History Lookup ---
    const { data: persona, error: pErr } = await admin.from('ai_personas').select('*').eq('name', personaName).single();
    if (pErr || !persona?.id) return fail(res, 404, 'PERSONA_LOOKUP', pErr);

    const { data: history, error: hErr } = await admin.from('conversation_history').select('sender, message_content').eq('user_id', userId).eq('persona_id', persona.id).order('created_at', { ascending: false }).limit(10);
    if (hErr) return fail(res, 500, 'HISTORY_LOOKUP', hErr);

    // --- Save User Message ---
    await admin.from('conversation_history').insert({ user_id: userId, persona_id: persona.id, sender: 'user', message_content: userMessage });

    // --- Parallel LLM Calls ---
    const systemPrompt = `You are ${persona.name}. Role: "${persona.role}". Attributes: ${persona.key_attributes}. Summary: "${persona.dossier_summary}". Respond as this persona. Stay in character. Be direct and intelligent.`;
    const messages = [ ...history.reverse().map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.message_content })), { role: 'user', content: userMessage } ];
    
    const promises = llm_providers.map(provider => {
        const chatMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        const openAILikeMessages = messages.map(m => ({ role: m.role, content: m.content }));
        
        switch (provider.name) {
            case 'Gemini':
                return provider.client.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent({ contents: chatMessages, systemInstruction: { role: 'system', parts: [{text: systemPrompt}] } }).then(r => `Gemini: ${r.response.text()}`);
            case 'Claude':
                return provider.client.messages.create({ model: "claude-3-haiku-20240307", system: systemPrompt, messages: openAILikeMessages, max_tokens: 1024 }).then(r => `Claude: ${r.content[0].text}`);
            case 'Grok':
                 return provider.client.chat.completions.create({ model: "llama3-70b-8192", messages: [{role: 'system', content: systemPrompt}, ...openAILikeMessages], max_tokens: 1024 }).then(r => `Grok: ${r.choices[0].message.content}`);
            default: // OpenAI, DeepSeek
                return provider.client.chat.completions.create({ model: "gpt-4-turbo", messages: [{role: 'system', content: systemPrompt}, ...openAILikeMessages], max_tokens: 1024 }).then(r => `${provider.name}: ${r.choices[0].message.content}`);
        }
    });

    const results = await Promise.allSettled(promises);
    const successfulResponses = results.filter(r => r.status === 'fulfilled').map(r => r.value).join('\n---\n');

    // --- Synthesis Step ---
    const synthesisPrompt = `You are the final layer of the Hydra Engine. Your task is to synthesize the best possible response for the persona "${persona.name}" based on suggestions from several AI models.
Persona Profile: ${systemPrompt}
User's Message: "${userMessage}"
Candidate Responses:
${successfulResponses}
---
Synthesize these into a single, cohesive, in-character response. Do not act as a reviewer; embody the persona and speak directly to the user. The final output must only be the persona's direct response.`;

    const finalCompletion = await llm_providers.find(p => p.name === 'OpenAI').client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'user', content: synthesisPrompt }],
      max_tokens: 1024,
    });

    const finalReply = finalCompletion.choices[0].message.content.trim();

    // --- Save AI Reply & Respond ---
    await admin.from('conversation_history').insert({ user_id: userId, persona_id: persona.id, sender: 'ai', message_content: finalReply });

    return res.status(200).json({ reply: finalReply, persona: persona.name });
  } catch (e) {
    console.error(e);
    return fail(res, 500, 'FATAL', e);
  }
}