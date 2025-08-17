import React from 'react';
import { Button } from './ui/button';

const HeroSection: React.FC = () => {
  const scrollToHydraWorkspace = () => {
    const element = document.getElementById('hydra-workspace');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#1A1A1A]">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00BFFF]/10 to-transparent">
          <svg className="w-full h-full animate-pulse" viewBox="0 0 1000 1000">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="#00BFFF" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="20" cy="20" r="2" fill="#00BFFF" opacity="0.5"/>
                <circle cx="80" cy="80" r="2" fill="#00BFFF" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Janus Image */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <img 
              src="/images/Janus.jpg" 
              alt="Janus AI" 
              className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-[#00BFFF] shadow-2xl shadow-[#00BFFF]/30 hover:shadow-[#D900FF]/40 transition-all duration-500"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#00BFFF]/20 to-transparent animate-pulse"></div>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-[#EAEAEA] mb-6 font-orbitron tracking-wide">
          Intelligence, <span className="text-[#00BFFF]">Evolved</span>
        </h1>

        {/* Sub-headline */}
        <h2 className="text-xl md:text-2xl text-[#EAEAEA]/80 mb-8 font-inter max-w-3xl mx-auto leading-relaxed">
          Meet the world's first fully synthetic, AI-powered digital workforce.
        </h2>

        {/* CTA Button */}
        <Button 
          onClick={scrollToHydraWorkspace}
          className="bg-[#00BFFF] hover:bg-[#D900FF] text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-[#00BFFF]/30 hover:shadow-[#D900FF]/40 hover:scale-105"
        >
          Explore the Command Center
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;