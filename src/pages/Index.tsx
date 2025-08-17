import React from 'react';
import AppLayout from '@/components/AppLayout';
import HeroSection from '@/components/HeroSection';
import AITeamShowcase from '@/components/AITeamShowcase';
import { CommandCenter } from '@/components/CommandCenter';
import { AppProvider } from '@/contexts/AppContext';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout>
        <div className="space-y-0">
          <HeroSection />
          
          <AITeamShowcase />
          
          <CommandCenter />
          
          <section className="grid md:grid-cols-3 gap-6 py-16 px-6">
            <div className="bg-[#222222] p-6 rounded-lg border border-[#444444] hover:border-[#00BFFF] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-[#00BFFF] font-orbitron">AI-Powered</h3>
              <p className="text-[#EAEAEA] font-inter">Advanced artificial intelligence at your fingertips</p>
            </div>
            <div className="bg-[#222222] p-6 rounded-lg border border-[#444444] hover:border-[#00BFFF] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-[#00BFFF] font-orbitron">Secure</h3>
              <p className="text-[#EAEAEA] font-inter">Enterprise-grade security for your peace of mind</p>
            </div>
            <div className="bg-[#222222] p-6 rounded-lg border border-[#444444] hover:border-[#00BFFF] transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3 text-[#00BFFF] font-orbitron">Fast</h3>
              <p className="text-[#EAEAEA] font-inter">Lightning-fast processing and real-time results</p>
            </div>
          </section>
        </div>
      </AppLayout>
    </AppProvider>
  );
};

export default Index;
