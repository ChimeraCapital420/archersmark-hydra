import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Formidable } from 'formidable';
import fs from 'fs/promises';

// --- Environment Variable Setup ---
const {
  NEXT_PUBLIC_SUPABASE_URL: SUPA_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPA_ANON,
  SUPABASE_SERVICE_ROLE_KEY: SUPA_SERVICE,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const adminSupabase = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });

// --- Helper Functions ---
function fail(res, code, stage, detail) {
  const msg = typeof detail === 'string' ? detail : (detail && (detail.message || JSON.stringify(detail)));
  return res.status(code).json({ error: stage, detail: msg || '' });
}

// This tells Vercel to not expect a body parser, as we're handling file uploads.
export const config = {
  api: {
    bodyParser: false,
  },
};

// --- Main Handler ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  try {
    // --- User Auth ---
    const authHeader = req.headers.authorization || '';
    const userClient = createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.id) return fail(res, 401, 'AUTH_GETUSER', userErr);
    const userId = user.id;

    // --- File Parsing ---
    const form = new Formidable();
    const [fields, files] = await form.parse(req);
    
    const uploadedFile = files.file?.[0];
    if (!uploadedFile) return fail(res, 400, 'FILE_MISSING', 'No file was uploaded.');

    const filePath = uploadedFile.filepath;
    const fileName = uploadedFile.originalFilename;
    const fileContent = await fs.readFile(filePath, 'utf8');

    // --- Upload Raw File to Storage ---
    const { error: storageError } = await adminSupabase.storage
      .from('knowledge_base')
      .upload(`${userId}/${fileName}`, fileContent, { upsert: true });

    if (storageError) return fail(res, 500, 'STORAGE_UPLOAD_FAILED', storageError);

    // --- Chunk Text ---
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(fileContent);

    // --- Create Embeddings and Store in Vector DB ---
    const embeddingPromises = chunks.map(async (chunk) => {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
      });

      return {
        user_id: userId,
        file_name: fileName,
        content: chunk,
        embedding: embeddingResponse.data[0].embedding,
      };
    });

    const embeddings = await Promise.all(embeddingPromises);
    const { error: insertError } = await adminSupabase.from('knowledge').insert(embeddings);
    
    if (insertError) return fail(res, 500, 'VECTOR_INSERT_FAILED', insertError);

    return res.status(200).json({ ok: true, message: `Successfully processed and stored "${fileName}".`, chunks: chunks.length });

  } catch (e) {
    console.error('Fatal error in knowledge upload:', e);
    return fail(res, 500, 'FATAL', e);
  }
}