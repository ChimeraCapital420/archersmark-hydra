import React, { useState } from 'react';
import AIRoster from '../components/mission-control/AIRoster';
import LiveCommsLog from '../components/mission-control/LiveCommsLog';
import HydraChatTest from '../components/HydraChatTest';
import { AITeamMember, aiTeamData } from '@/data/aiTeamData';
import TaskingTerminal from '../components/mission-control/TaskingTerminal';

const MissionControl: React.FC = () => {
  const [selectedAI, setSelectedAI] = useState<AITeamMember>(aiTeamData[0]);

  const handleAISelect = (aiMember: AITeamMember) => {
    setSelectedAI(aiMember);
  };

  // The outer div with padding and background is now handled by AppLayout
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-['Orbitron'] text-[#00BFFF] mb-8 text-center">
          Mission Control
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <AIRoster selectedAI={selectedAI} onAISelect={handleAISelect} />
          </div>
          <div className="lg:col-span-6">
            {selectedAI ? (
              <HydraChatTest personaName={selectedAI.name} />
            ) : (
              <TaskingTerminal />
            )}
          </div>
          <div className="lg:col-span-3">
            <LiveCommsLog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;