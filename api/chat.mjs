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
const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // For embeddings

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
    // ... (This function remains the same as the previous version)
}

// New function to scrape a URL
async function scrapeURL(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, noscript, iframe, img, svg').remove();
        let text = $('body').text();
        text = text.replace(/\s\s+/g, ' ').trim();
        return text.slice(0, 8000); // Limit to ~8k characters to keep context manageable
    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
        await logHydraEvent({ log_type: 'WEB_SCRAPE_FAILURE', provider: 'cheerio', error_message: error.message, metadata: { url } });
        return `[Could not retrieve content from the URL: ${url}]`;
    }
}

// --- Main Handler ---
export default async function handler(req, res) {
  // ... (CORS headers and method checks remain the same)
  
  try {
    const { data: { user } } = await createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: req.headers.authorization } }, auth: { persistSession: false } }).auth.getUser();
    if (!user) return fail(res, 401, 'AUTH_GETUSER', 'Invalid user');
    
    const { message: userMessage, personaName = 'Janus' } = req.body;
    if (!userMessage) return fail(res, 400, 'MESSAGE_REQUIRED');

    const { data: persona } = await adminSupabase.from('ai_personas').select('*').eq('name', personaName).single();
    if (!persona) return fail(res, 404, 'PERSONA_LOOKUP', 'Persona not found');
    
    await adminSupabase.from('conversation_history').insert({ user_id: user.id, persona_id: persona.id, sender: 'user', message_content: userMessage });

    // --- NEW: Web Reader Logic ---
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsInMessage = userMessage.match(urlRegex);
    let webContext = '';
    if (urlsInMessage) {
        const scrapePromises = urlsInMessage.map(url => scrapeURL(url));
        const scrapedContents = await Promise.all(scrapePromises);
        webContext = scrapedContents.join('\n\n');
    }

    // --- Search Knowledge Base ---
    const embeddingResponse = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: userMessage });
    const userMessageEmbedding = embeddingResponse.data[0].embedding;

    const { data: documents } = await adminSupabase.rpc('match_documents', {
        query_embedding: userMessageEmbedding,
        match_count: 5,
    });
    
    let knowledgeContext = '';
    if (documents && documents.length > 0) {
        knowledgeContext = documents.map(d => `Source: ${d.file_name}\nContent: ${d.content}`).join('\n\n---\n\n');
    }

    // --- Prepare Prompts and History ---
    let combinedContext = '';
    if (webContext) combinedContext += `CONTEXT FROM