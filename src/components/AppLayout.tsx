import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1A1A1A] border-b border-[#444444] px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 text-[#00BFFF] hover:text-[#D900FF] transition-colors"
            >
              ☰
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-[#EAEAEA] text-sm">Welcome to the future</span>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto fade-in">
            {children || (
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold mb-4 font-['Orbitron']">
                  Welcome to famous.ai
                </h1>
                <p className="text-[#EAEAEA] text-lg">
                  The future of AI-powered solutions
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default AppLayout;