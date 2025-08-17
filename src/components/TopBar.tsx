// src/components/TopBar.tsx
import { supabase } from "../lib/supabaseClient"

export default function TopBar() {
  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // ignore
    } finally {
      // reload to show login screen again
      window.location.href = "/"
    }
  }

  function go(path: string) {
    window.location.href = path
  }

  return (
    <div className="w-full border-b border-zinc-800 bg-[#0f0f10] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-white">
        <div
          className="text-lg font-bold cursor-pointer"
          onClick={() => go("/")}
        >
          Archersmark Hydra
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => go("/")}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800"
          >
            Home
          </button>
          <button
            onClick={() => go("/mission")}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800"
          >
            Mission Control
          </button>
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg bg-[#00BFFF] text-black font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
