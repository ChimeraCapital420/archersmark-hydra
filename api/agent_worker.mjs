// This is a placeholder for now. We will fill in the full AI logic in the next step.
// For now, it just confirms the task was received and updates its status.

import { createClient } from '@supabase/supabase-js';

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPA_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPA_SERVICE,
} = process.env;

const adminSupabase = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const task = req.body.record; // Supabase webhook sends the new row in `record`

    // 1. Acknowledge the task by updating its status
    await adminSupabase.from('tasks').update({ status: 'in_progress' }).eq('id', task.id);

    // 2. Log that the assigned agent has started working
    await adminSupabase.from('task_updates').insert({
        task_id: task.id,
        persona_id: task.assigned_persona_id,
        update_message: 'Directive received. Analyzing requirements and formulating initial plan.'
    });

    // 3. Simulate work and mark as complete (for now)
    // In the future, this is where the real AI logic will go.
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate 5 seconds of work

    await adminSupabase.from('tasks').update({ status: 'completed', result: { message: "Initial analysis complete. Awaiting further instruction." } }).eq('id', task.id);

    return res.status(200).json({ ok: true, message: `Processed task ${task.id}` });

  } catch (e) {
    console.error('Error in agent worker:', e);
    return res.status(500).json({ error: 'Failed to process task', detail: e.message });
  }
}