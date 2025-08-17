// src/App.tsx
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import AuthGate from "@/components/AuthGate"

import Index from "./pages/Index"
import MissionControl from "./pages/MissionControl"
import Knowledge from "./pages/Knowledge" // Import the new page
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner richColors />
        <Toaster />
        <AuthGate>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mission" element={<MissionControl />} />
              <Route path="/knowledge" element={<Knowledge />} /> {/* Add the new route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
)

export default App