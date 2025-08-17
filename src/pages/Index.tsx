// src/pages/Index.tsx
import { useState } from "react"
import PersonaGrid from "../components/PersonaGrid"
import HydraChatTest from "../components/HydraChatTest"

export default function Index() {
  const [who, setWho] = useState("Janus")

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Archersmark Hydra</h1>
        <p className="text-zinc-400 mb-6">Private command center</p>

        {/* 1) Your roster from Supabase */}
        <PersonaGrid selectedName={who} onSelect={setWho} />

        {/* 2) Chat with the selected persona */}
        <HydraChatTest personaName={who} />
      </div>
    </div>
  )
}
