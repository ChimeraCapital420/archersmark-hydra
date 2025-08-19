import React, { useEffect, useRef, useState } from "react";
import { sendChat } from "../lib/hydraApi";
import { supabase } from "../lib/supabaseClient";
import VoiceInput from "./VoiceInput";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useAppContext } from "@/contexts/AppContext"; // Import the App Context

type Row = {
  id: number;
  sender: "user" | "ai";
  message_content: string;
  image_url: string | null;
  created_at: string;
};

export default function HydraChatTest({ personaName }: { personaName: string }) {
  const [msg, setMsg] = useState("");
  const [replying, setReplying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [history, setHistory] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const { isSpeechEnabled } = useAppContext(); // Get the global speech state
  const { speak } = useSpeechSynthesis();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageId = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    if (isSpeechEnabled && history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (lastMessage.sender === 'ai' && lastMessage.id !== lastSpokenMessageId.current) {
        speak(lastMessage.message_content, personaName);
        lastSpokenMessageId.current = lastMessage.id; // Mark this message as spoken
      }
    }
  }, [history, personaName, speak, isSpeechEnabled]);

  const [userId, setUserId] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      setErr(null);
      setLoading(true);
      const { data: persona } = await supabase.from("ai_personas").select("id").eq("name", personaName).single();
      if (!live) return;
      if (!persona?.id) {
        setErr("Persona not found");
        setPersonaId(null);
        setLoading(false);
        return;
      }
      setPersonaId(persona.id);
      const { data: rows, error: hErr } = await supabase.from("conversation_history").select("*").eq("persona_id", persona.id).order("created_at", { ascending: true }).limit(50);
      if (!live) return;
      if (hErr) setErr(hErr.message);
      setHistory(rows || []);
      setLoading(false);
    })();
    return () => { live = false; };
  }, [personaName]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim() || !personaId) return;
    setErr(null);
    setReplying(true);
    try {
      setHistory(h => [...h, { id: Date.now(), sender: "user", message_content: msg.trim(), image_url: null, created_at: new Date().toISOString() }]);
      setMsg("");
      await sendChat(msg, personaName);
      const { data: rows } = await supabase.from("conversation_history").select("*").eq("persona_id", personaId).order("created_at", { ascending: true }).limit(50);
      setHistory(rows || []);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      const { data: rows } = await supabase.from("conversation_history").select("*").eq("persona_id", personaId).order("created_at", { ascending: true }).limit(50);
      setHistory(rows || []);
    } finally {
      setReplying(false);
    }
  }

  const handleTranscript = (transcript: string) => {
    setMsg(prevMsg => prevMsg.endsWith(' ') || prevMsg === '' ? prevMsg + transcript : prevMsg + ' ' + transcript);
  };

  return (
    <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 text-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold">
          Chat with <span className="text-[#00BFFF]">{personaName}</span>
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-zinc-400 text-sm">Loading history…</div>}
        {!loading && history.length === 0 && (
          <div className="text-zinc-400 text-sm">No messages yet. Say hi to {personaName}.</div>
        )}
        {history.map(m => (
          <div key={m.id} className={`p-2 rounded-lg border ${m.sender === "user" ? "bg-zinc-800/80 border-zinc-700" : "bg-zinc-900/80 border-zinc-700"}`}>
            <div className="text-xs text-zinc-400 mb-1">{m.sender === "user" ? "You" : personaName} • {new Date(m.created_at).toLocaleString()}</div>
            <div className="whitespace-pre-wrap">{m.message_content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSend} className="p-4 border-t border-zinc-800 space-y-3 flex-shrink-0">
        {err && <div className="text-sm text-red-400">{err}</div>}
        <div className="flex items-start gap-2">
          <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Type or dictate a message for ${personaName}…`} className="w-full min-h-[90px] p-3 rounded bg-zinc-800 border border-zinc-700 outline-none resize-none" />
          <VoiceInput onTranscript={handleTranscript} />
        </div>
        <button disabled={replying || !msg.trim()} className="px-4 py-2 rounded bg-[#00BFFF] text-black font-semibold disabled:opacity-60">
          {replying ? "Sending…" : `Send to ${personaName}`}
        </button>
      </form>
    </div>
  );
}