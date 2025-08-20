import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import AuthGate from "@/components/AuthGate"
import { AppProvider } from "./contexts/AppContext"
import AppLayout from "./components/AppLayout"

import Index from "./pages/Index"
import MissionControl from "./pages/MissionControl"
import Knowledge from "./pages/Knowledge"
import TaskCenter from "./pages/TaskCenter"
import Workshop from "./pages/Workshop" // Import the new page
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner richColors />
        <Toaster />
        <AuthGate>
          <AppProvider>
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/mission" element={<MissionControl />} />
                  <Route path="/knowledge" element={<Knowledge />} />
                  <Route path="/tasks" element={<TaskCenter />} />
                  <Route path="/workshop" element={<Workshop />} /> {/* Add the new route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </AppProvider>
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
)

export default App