// src/components/PersonaGrid.tsx
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

type Persona = {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

export default function PersonaGrid({
  onSelect,
  selectedName,
}: {
  onSelect: (name: string) => void
  selectedName: string
}) {
  const [rows, setRows] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setErr(null)
      setLoading(true)
      const { data, error } = await supabase
        .from("ai_personas")
        .select("id,name,role,avatar_url")
        .order("name", { ascending: true })
      if (!alive) return
      if (error) setErr(error.message)
      else setRows(data || [])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (err) {
    return <div className="text-red-400">Couldn’t load personas: {err}</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {rows.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p.name)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition
            ${selectedName === p.name ? "border-[#00BFFF] bg-zinc-900/70" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"}`}
        >
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-zinc-400 text-sm">no image</div>
            )}
          </div>
          <div className="text-sm font-semibold">{p.name}</div>
          <div className="text-xs text-zinc-400 text-center">{p.role}</div>
        </button>
      ))}
    </div>
  )
}
