import React from 'react';
import { aiTeamData, AITeamMember } from '@/data/aiTeamData';
import { cn } from '@/lib/utils';

interface AIRosterProps {
  selectedAI: AITeamMember | null;
  onAISelect: (aiMember: AITeamMember) => void;
}

const AIRoster: React.FC<AIRosterProps> = ({ selectedAI, onAISelect }) => {
  return (
    <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-[calc(100vh-150px)] flex flex-col">
      <h3 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF] mb-6 flex-shrink-0">
        AI Roster
      </h3>
      <div className="space-y-2 overflow-y-auto flex-grow">
        {aiTeamData.map((member) => (
          <div
            key={member.name}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg hover:bg-[#222222] transition-colors duration-200 cursor-pointer group border border-transparent",
              selectedAI?.name === member.name && "bg-[#00BFFF]/10 border-[#00BFFF]/50"
            )}
            onClick={() => onAISelect(member)}
          >
            <div className={cn(
              "w-3 h-3 rounded-full flex-shrink-0",
              selectedAI?.name === member.name ? "bg-[#D900FF] animate-pulse" : "bg-[#00BFFF]"
            )}></div>
            <div className="min-w-0">
              <p className="text-[#EAEAEA] group-hover:text-[#D900FF] transition-colors duration-300 truncate">
                {member.name}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRoster;