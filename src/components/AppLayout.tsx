import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import Sidebar from './Sidebar';
import { supabase } from '@/lib/supabaseClient';
import { Button } from './ui/button';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { toggleSidebar } = useAppContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload(); // Force a reload to clear state and redirect
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen">
        <header className="bg-[#111111] border-b border-[#444444] px-4 py-2 flex items-center justify-between flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-[#00BFFF] hover:text-[#D900FF] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="flex-1"></div> {/* Spacer */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/mission">Mission Control</Link>
            </Button>
            <Button variant="ghost" asChild>
               <Link to="/knowledge">Knowledge</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;