import React from 'react';

const TaskingTerminal: React.FC = () => {
  return (
    <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-full relative overflow-hidden">
      <h3 className="text-2xl font-bold font-['Orbitron'] text-[#00BFFF] mb-8 text-center">
        Hydra Tasking Interface
      </h3>
      
      {/* Background Hydra graphic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg width="300" height="300" viewBox="0 0 300 300" className="text-[#00BFFF]">
          <circle cx="150" cy="150" r="20" fill="currentColor" className="animate-pulse" />
          {[...Array(7)].map((_, i) => {
            const angle = (i * 360) / 7;
            const x = 150 + Math.cos((angle * Math.PI) / 180) * 80;
            const y = 150 + Math.sin((angle * Math.PI) / 180) * 80;
            return (
              <g key={i}>
                <line x1="150" y1="150" x2={x} y2={y} stroke="currentColor" strokeWidth="2" />
                <circle cx={x} cy={y} r="15" fill="currentColor" className="animate-pulse" 
                        style={{ animationDelay: `${i * 0.2}s` }} />
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="relative z-10 text-center mt-16">
        <p className="text-lg text-[#EAEAEA] leading-relaxed">
          Select an operative from the AI Roster to view active sub-routines and assign new directives.
        </p>
      </div>
    </div>
  );
};

export default TaskingTerminal;