// src/pages/Index.tsx
import { useState } from "react"
import TopBar from "../components/TopBar"
import PersonaGrid from "../components/PersonaGrid"
import HydraChatTest from "../components/HydraChatTest"

export default function Index() {
  const [who, setWho] = useState("Janus")

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white">
      <TopBar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Home</h1>
        <p className="text-zinc-400 mb-6">Select a persona and chat.</p>

        {/* Persona roster */}
        <PersonaGrid selectedName={who} onSelect={setWho} />

        {/* Chat box */}
        <HydraChatTest personaName={who} />
      </div>
    </div>
  )
}
