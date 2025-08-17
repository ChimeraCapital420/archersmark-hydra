import React from 'react';
import { useAppContext } from '@/contexts/AppContext';

const Sidebar: React.FC = () => {
  const { sidebarOpen } = useAppContext();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#111111] border-r border-[#444444] transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } md:relative md:w-64`}
    >
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#00BFFF] to-[#D900FF] rounded-lg"></div>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <h1 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF]">
              famous.ai
            </h1>
          )}
        </div>

        <nav className="mt-8 space-y-2">
          <a
            href="/"
            className="flex items-center px-4 py-3 text-[#EAEAEA] hover:text-[#D900FF] hover:bg-[#222222] rounded-lg transition-colors"
          >
            <span className="w-5 h-5 mr-3">🏠</span>
            {(sidebarOpen || window.innerWidth >= 768) && <span>Home</span>}
          </a>
          <a
            href="/mission"
            className="flex items-center px-4 py-3 text-[#EAEAEA] hover:text-[#D900FF] hover:bg-[#222222] rounded-lg transition-colors"
          >
            <span className="w-5 h-5 mr-3">🎯</span>
            {(sidebarOpen || window.innerWidth >= 768) && <span>Mission Control</span>}
          </a>
          {/* New Link */}
          <a
            href="/knowledge"
            className="flex items-center px-4 py-3 text-[#EAEAEA] hover:text-[#D900FF] hover:bg-[#222222] rounded-lg transition-colors"
          >
            <span className="w-5 h-5 mr-3">📚</span>
            {(sidebarOpen || window.innerWidth >= 768) && <span>Knowledge</span>}
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-3 text-[#EAEAEA] hover:text-[#D900FF] hover:bg-[#222222] rounded-lg transition-colors"
          >
            <span className="w-5 h-5 mr-3">📞</span>
            {(sidebarOpen || window.innerWidth >= 768) && <span>Contact</span>}
          </a>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;