import { createClient } from '@supabase/supabase-js';

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPA_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPA_ANON,
  SUPABASE_SERVICE_ROLE_KEY: SUPA_SERVICE,
} = process.env;

const adminSupabase = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });

function fail(res, code, stage, detail) {
  const msg = typeof detail === 'string' ? detail : (detail && (detail.message || JSON.stringify(detail)));
  return res.status(code).json({ error: stage, detail: msg || '' });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'METHOD_NOT_ALLOWED');

  try {
    const { data: { user } } = await createClient(SUPA_URL, SUPA_ANON, { global: { headers: { Authorization: req.headers.authorization } }, auth: { persistSession: false } }).auth.getUser();
    if (!user) return fail(res, 401, 'AUTH_GETUSER', 'Invalid user');

    const { directive, personaName = 'Janus' } = req.body;
    if (!directive) return fail(res, 400, 'DIRECTIVE_REQUIRED');

    // Find Janus's ID to assign the initial task
    const { data: leadPersona, error: pErr } = await adminSupabase.from('ai_personas').select('id').eq('name', personaName).single();
    if (pErr || !leadPersona) return fail(res, 404, 'LEAD_PERSONA_NOT_FOUND', `Could not find persona named ${personaName}`);

    // Insert the initial high-level task into the queue
    const { data: task, error: tErr } = await adminSupabase.from('tasks').insert({
        user_id: user.id,
        directive: directive,
        originating_persona_id: leadPersona.id,
        assigned_persona_id: leadPersona.id, // Janus starts by breaking it down
        context: { initial_directive: directive }
    }).select().single();

    if (tErr) return fail(res, 500, 'TASK_CREATION_FAILED', tErr);

    return res.status(202).json({
      message: "Task accepted. Janus is assessing the directive.",
      taskId: task.id
    });

  } catch (e) {
    console.error('Fatal error in orchestrator:', e);
    return fail(res, 500, 'FATAL', e);
  }
}