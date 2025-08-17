import React from 'react';
import { LiveProjectStatus } from './dashboard/LiveProjectStatus';
import { GlobalIntelligenceFeed } from './dashboard/GlobalIntelligenceFeed';
import { SystemPerformance } from './dashboard/SystemPerformance';

export const CommandCenter: React.FC = () => {
  return (
    <section id="command-center" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            The Command Center
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real-time insights into the Hydra team's live operations and global intelligence network
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <LiveProjectStatus />
          <GlobalIntelligenceFeed />
          <SystemPerformance />
        </div>
      </div>
    </section>
  );
};