import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import cheerio from 'cheerio';

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

const adminSupabase = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// --- Helper Functions ---
function fail(res, code, stage, detail) {
  const msg = typeof detail === 'string' ? detail : (detail && (detail.message || JSON.stringify(detail)));
  return res.status(code).json({ error: stage, detail: msg || '' });
}

async function logHydraEvent(log) {
    try {
        await adminSupabase.from('hydra_engine_logs').insert(log);
    } catch (e) {
        console.error("Failed to write to hydra_engine_logs:", e);
    }
}

async function getProviderResponse(provider, systemPrompt, messages) {
    // This function remains the same
    try {
        const openAILikeMessages = messages.map(m => ({ role: m.role, content: m.content }));
        switch (provider.name) {
            case 'Gemini':
                const geminiMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
                const geminiModel = provider.client.getGenerativeModel({ model: "gemini-1.5-flash" });
                const geminiResult = await geminiModel.generateContent({ contents: geminiMessages, systemInstruction: { role: 'system', parts: [{text: systemPrompt}] } });
                return `${provider.name}: ${geminiResult.response.text()}`;
            case 'Claude':
                const claudeResult = await provider.client.messages.create({ model: "claude-3-haiku-20240307", system: systemPrompt, messages: openAILikeMessages, max_tokens: 1024 });
                return `Claude: ${claudeResult.content[0].text}`;
            case 'Grok':
                const groqResult = await provider.client.chat.completions.create({ model: "llama3-70b-8192", messages: [{role: 'system', content: systemPrompt}, ...openAILikeMessages], max_tokens: 1024 });
                return `Grok: ${groqResult.choices[0].message.content}`;
            default: // OpenAI, DeepSeek
                const model = provider.name === 'DeepSeek' ? 'deepseek-chat' : 'gpt-4-turbo';
                const result = await provider.client.chat.completions.create({ model, messages: [{role: 'system', content: systemPrompt}, ...openAILikeMessages], max_tokens: 1024 });
                return `${provider.name}: ${result.choices[0].message.content}`;
        }
    } catch (error) {
        console.error(`Error from ${provider.name}:`, error.message);
        await logHydraEvent({
            log_type: 'API_FAILURE',
            provider: provider.name,
            error_message: error.message,
            metadata: { persona: systemPrompt.split('.')[0] }
        });
        return null;
    }
}

async function scrapeURL(url) {
    // This function remains the same
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'HydraEngineBot/1.0' } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, noscript, iframe, img, svg, header, footer, nav, aside').remove();
        let text = $('body').text();
        text = text.replace(/\s\s+/g, ' ').trim();
        return text.slice(0, 8000);
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        await logHydraEvent({ log_type: 'WEB_SCRAPE_FAILURE', provider: 'cheerio', error_message: error.message, metadata: { url } });
        return `[Could not retrieve content from the URL: ${url}]`;
    }
}

// --- Main Handler ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');
  if (llm_providers.length === 0) return fail(res, 500, 'ENV_LLM_KEYS_MISSING', 'No AI provider API keys found');

  try {
    const { data: { user } } = await createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: req.headers.authorization } }, auth: { persistSession: false } }).auth.getUser();
    if (!user) return fail(res, 401, 'AUTH_GETUSER', 'Invalid user');
    
    const { message: userMessage, personaName = 'Janus' } = req.body;
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED');

    const { data: persona } = await adminSupabase.from('ai_personas').select('*').eq('name', personaName).single();
    if (!persona) return fail(res, 404, 'PERSONA_LOOKUP', 'Persona not found');
    
    await adminSupabase.from('conversation_history').insert({ user_id: user.id, persona_id: persona.id, sender: 'user', message_content: userMessage });

    let knowledgeContext = '';
    // --- NEW: Graceful failure for Knowledge Base search ---
    if (openai) {
        try {
            const embeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: userMessage });
            const userMessageEmbedding = embeddingResponse.data[0].embedding;
            const { data: documents } = await adminSupabase.rpc('match_documents', { query_embedding: userMessageEmbedding, match_count: 5 });
            if (documents && documents.length > 0) {
                knowledgeContext = documents.map(d => `Source: ${d.file_name}\nContent: ${d.content}`).join('\n\n---\n\n');
            }
        } catch (e) {
            console.error("Knowledge base search failed:", e.message);
            await logHydraEvent({ log_type: 'EMBEDDING_FAILURE', provider: 'OpenAI', error_message: e.message });
            knowledgeContext = '[Knowledge Base search failed due to API error. Proceeding without it.]';
        }
    } else {
        knowledgeContext = '[Knowledge Base is disabled. No OpenAI key found for embeddings.]';
    }
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsInMessage = userMessage.match(urlRegex);
    let webContext = '';
    if (urlsInMessage) {
        const scrapePromises = urlsInMessage.map(url => scrapeURL(url));
        const scrapedContents = await Promise.all(scrapePromises);
        webContext = scrapedContents.join('\n\n');
    }

    let combinedContext = '';
    if(webContext) combinedContext += `CONTEXT FROM WEB:\n${webContext}\n\n`;
    if(knowledgeContext) combinedContext += `CONTEXT FROM KNOWLEDGE BASE:\n${knowledgeContext}\n\n`;

    const { data: history } = await adminSupabase.from('conversation_history').select('sender, message_content').eq('user_id', user.id).eq('persona_id', persona.id).order('created_at', { ascending: false }).limit(10);
    const systemPrompt = `You are ${persona.name}. Role: "${persona.role}". Attributes: ${persona.key_attributes}. Summary: "${persona.dossier_summary}". Respond as this persona. Stay in character. Be direct and intelligent. If relevant, use the following context from the user's knowledge base and provided web links to inform your response:\n\n<CONTEXT>\n${combinedContext || 'No context provided.'}\n</CONTEXT>`;
    const messages = [ ...history.reverse().map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.message_content })), { role: 'user', content: userMessage } ];
    
    const promises = llm_providers.map(p => getProviderResponse(p, systemPrompt, messages));
    const results = await Promise.all(promises);
    const successfulResponses = results.filter(Boolean).join('\n---\n');

    if (!successfulResponses) {
        await logHydraEvent({ log_type: 'ALL_PROVIDERS_FAILED', error_message: 'All AI providers failed to respond.' });
        return fail(res, 503, 'ALL_PROVIDERS_FAILED', 'All AI providers failed to respond.');
    }

    const synthesisPrompt = `You are the final layer of the Hydra Engine. Your task is to synthesize the best possible response for the persona "${persona.name}" based on suggestions from several AI models.\nPersona Profile: ${systemPrompt}\nUser's Message: "${userMessage}"\nCandidate Responses:\n${successfulResponses}\n---\nSynthesize these into a single, cohesive, in-character response. Do not act as a reviewer; embody the persona and speak directly to the user. The final output must only be the persona's direct response.`;
    
    let finalReply = 'Error: Could not synthesize a final response.';
    const synthesis_candidates = ['Claude', 'Gemini', 'OpenAI', 'Grok'];

    for (const candidateName of synthesis_candidates) {
        const provider = llm_providers.find(p => p.name === candidateName);
        if (provider) {
            const response = await getProviderResponse(provider, 'You are a master synthesizer AI.', [{ role: 'user', content: synthesisPrompt }]);
            if (response) {
                finalReply = response.substring(response.indexOf(':') + 2);
                break;
            }
        }
    }

    await adminSupabase.from('conversation_history').insert({ user_id: user.id, persona_id: persona.id, sender: 'ai', message_content: finalReply });
    return res.status(200).json({ reply: finalReply, persona: persona.name });

  } catch (e) {
    console.error('Fatal error in chat handler:', e);
    await logHydraEvent({ log_type: 'FATAL_ERROR', error_message: e.message, metadata: { stack: e.stack } });
    return fail(res, 500, 'FATAL', e);
  }
}