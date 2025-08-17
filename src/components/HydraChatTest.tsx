// src/components/HydraChatTest.tsx
// Chat box + live history for the selected persona
import { useEffect, useMemo, useRef, useState } from "react"
import { sendChat } from "../lib/hydraApi"
import { supabase } from "../lib/supabaseClient"

type Row = {
  id: number
  sender: "user" | "ai"
  message_content: string
  image_url: string | null
  created_at: string
}

export default function HydraChatTest({ personaName }: { personaName: string }) {
  const [msg, setMsg] = useState("")
  const [replying, setReplying] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [history, setHistory] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history.length])

  // Load user id once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  // Whenever personaName changes, resolve its id and load history
  useEffect(() => {
    let live = true
    ;(async () => {
      setErr(null)
      setLoading(true)
      setHistory([])

      // 1) Find the persona's id by name
      const { data: persona, error: pErr } = await supabase
        .from("ai_personas")
        .select("id")
        .eq("name", personaName)
        .single()
      if (!live) return

      if (pErr || !persona?.id) {
        setErr(pErr?.message || "Persona not found")
        setPersonaId(null)
        setLoading(false)
        return
      }
      setPersonaId(persona.id)

      // 2) Load last 50 messages for this user+persona
      const { data: rows, error: hErr } = await supabase
        .from("conversation_history")
        .select("id,sender,message_content,image_url,created_at")
        .eq("persona_id", persona.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .order("created_at", { ascending: true })
        .limit(50)

      if (!live) return
      if (hErr) setErr(hErr.message)
      setHistory(rows || [])
      setLoading(false)
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaName, userId])

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    if (!msg.trim() || !personaId) return
    setErr(null)
    setReplying(true)
    try {
      // Optimistic add of the user message
      const optimisticId = Math.floor(Math.random() * 1e9)
      const now = new Date().toISOString()
      setHistory(h => [...h, {
        id: optimisticId, sender: "user", message_content: msg.trim(),
        image_url: null, created_at: now
      }])

      // Call the server (this also writes both user+ai rows in Supabase)
      const res = await sendChat(msg, personaName)
      setMsg("")

      // Reload authoritative history
      const { data: rows } = await supabase
        .from("conversation_history")
        .select("id,sender,message_content,image_url,created_at")
        .eq("persona_id", personaId)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .order("created_at", { ascending: true })
        .limit(50)
      setHistory(rows || [])

    } catch (e: any) {
      setErr(e?.message || "Something went wrong")
    } finally {
      setReplying(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 text-white">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Chat with <span className="text-[#00BFFF]">{personaName}</span>
        </h2>
      </div>

      {/* History */}
      <div className="max-h-[40vh] overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-zinc-400 text-sm">Loading history…</div>}
        {!loading && history.length === 0 && (
          <div className="text-zinc-400 text-sm">No messages yet. Say hi to {personaName}.</div>
        )}

        {history.map(m => (
          <div key={m.id}
               className={`p-2 rounded-lg border ${
                 m.sender === "user"
                   ? "bg-zinc-800/80 border-zinc-700"
                   : "bg-zinc-900/80 border-zinc-700"
               }`}>
            <div className="text-xs text-zinc-400 mb-1">
              {m.sender === "user" ? "You" : personaName}
              {" • "}
              {new Date(m.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{m.message_content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={onSend} className="p-4 border-t border-zinc-800 space-y-3">
        {err && <div className="text-sm text-red-400">{err}</div>}
        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={`Type a message for ${personaName}…`}
          className="w-full min-h-[90px] p-3 rounded bg-zinc-800 border border-zinc-700 outline-none"
        />
        <button
          disabled={replying || !msg.trim()}
          className="px-4 py-2 rounded bg-[#00BFFF] text-black font-semibold disabled:opacity-60"
        >
          {replying ? "Sending…" : `Send to ${personaName}`}
        </button>
      </form>
    </div>
  )
}
