import React from 'react';

const nodes = [
  { x: 20, y: 30, color: 'cyan' },
  { x: 75, y: 25, color: 'magenta' },
  { x: 45, y: 60, color: 'cyan' },
  { x: 85, y: 70, color: 'magenta' },
  { x: 15, y: 75, color: 'cyan' },
  { x: 60, y: 40, color: 'magenta' }
];

export const GlobalIntelligenceFeed: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/60 transition-all duration-300">
      <h3 className="text-xl font-bold text-cyan-400 mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Global Intelligence Feed
      </h3>
      
      <div className="relative h-48 bg-gray-900 rounded-lg overflow-hidden">
        {/* World Map Outline */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 50">
          <path
            d="M10,20 Q20,15 30,20 Q40,25 50,20 Q60,15 70,20 Q80,25 90,20"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-cyan-400"
          />
          <path
            d="M15,35 Q25,30 35,35 Q45,40 55,35 Q65,30 75,35 Q85,40 90,35"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-cyan-400"
          />
        </svg>
        
        {/* Pulsing Nodes */}
        {nodes.map((node, index) => (
          <div
            key={index}
            className={`absolute w-3 h-3 rounded-full ${
              node.color === 'cyan' ? 'bg-cyan-400' : 'bg-magenta-400'
            }`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              animation: `pulse 2s infinite ${index * 0.3}s`
            }}
          />
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Active Nodes: {nodes.length}</span>
          <span className="text-green-400">● Online</span>
        </div>
      </div>
    </div>
  );
};