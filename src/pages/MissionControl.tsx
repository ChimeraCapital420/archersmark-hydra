// src/pages/MissionControl.tsx
import { useState } from "react"
import TopBar from "../components/TopBar"
import PersonaGrid from "../components/PersonaGrid"
import HydraChatTest from "../components/HydraChatTest"

export default function MissionControl() {
  const [who, setWho] = useState("Janus")

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA]">
      <TopBar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Mission Control</h1>
        <p className="text-zinc-400 mb-6">Your roster and live comms.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">AI Roster</h2>
            <PersonaGrid selectedName={who} onSelect={setWho} />
          </div>

          <div>
            <HydraChatTest personaName={who} />
          </div>
        </div>
      </div>
    </div>
  )
}
