import React from 'react';

const metrics = [
  { label: 'Hydra Cognitive Load', value: 73, color: 'cyan' },
  { label: 'Data Throughput', value: 89, color: 'magenta' },
  { label: 'Network Integrity', value: 96, color: 'green' }
];

export const SystemPerformance: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-cyan-400/30 rounded-lg p-6 hover:border-cyan-400/60 transition-all duration-300">
      <h3 className="text-xl font-bold text-cyan-400 mb-6" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        System Performance
      </h3>
      
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-sm font-medium">{metric.label}</span>
              <span className={`text-sm font-bold ${
                metric.color === 'cyan' ? 'text-cyan-400' : 
                metric.color === 'magenta' ? 'text-magenta-400' : 'text-green-400'
              }`}>
                {metric.value}%
              </span>
            </div>
            
            {/* Animated Line Graph */}
            <div className="relative h-12 bg-gray-900 rounded">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
                <polyline
                  points="0,30 20,25 40,20 60,15 80,10 100,8"
                  fill="none"
                  stroke={metric.color === 'cyan' ? '#00BFFF' : metric.color === 'magenta' ? '#FF00FF' : '#00FF00'}
                  strokeWidth="2"
                  className="opacity-80"
                  style={{
                    strokeDasharray: '200',
                    strokeDashoffset: '200',
                    animation: `drawLine 2s ease-out ${index * 0.5}s forwards`
                  }}
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};