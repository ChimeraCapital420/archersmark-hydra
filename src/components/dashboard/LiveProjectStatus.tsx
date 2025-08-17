import React from 'react';

const projects = [
  { name: 'Project: Aegis', progress: 87 },
  { name: 'Project: Neptune', progress: 64 },
  { name: 'Tagnetiq v9.2', progress: 92 },
  { name: 'Project: Phoenix', progress: 45 },
  { name: 'Neural Link Alpha', progress: 78 }
];

export const LiveProjectStatus: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/60 transition-all duration-300">
      <h3 className="text-xl font-bold text-cyan-400 mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Live Project Status
      </h3>
      
      <div className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm font-medium">{project.name}</span>
              <span className="text-cyan-400 text-sm">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-magenta-400 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${project.progress}%`,
                  animation: `fillProgress 2s ease-out ${index * 0.2}s both`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes fillProgress {
          from { width: 0%; }
          to { width: var(--progress); }
        }
      `}</style>
    </div>
  );
};