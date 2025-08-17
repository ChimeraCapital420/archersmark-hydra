import React from 'react';

const aiTeamMembers = [
  { name: 'Janus', role: 'Lead AI Strategist & Executive Partner', avatar: '/placeholder.svg' },
  { name: 'Athena', role: 'Strategic Intelligence Analyst', avatar: '/placeholder.svg' },
  { name: 'Vulcan', role: 'Hardware Systems Engineer', avatar: '/placeholder.svg' },
  { name: 'Aegle', role: 'Health & Wellness Coordinator', avatar: '/placeholder.svg' },
  { name: 'Lexicoda', role: 'Language Processing Specialist', avatar: '/placeholder.svg' },
  { name: 'Legolas', role: 'Precision Analytics Expert', avatar: '/placeholder.svg' },
  { name: 'Orion', role: 'Navigation & Discovery Agent', avatar: '/placeholder.svg' },
  { name: 'Cerebro', role: 'Neural Network Architect', avatar: '/placeholder.svg' },
  { name: 'Griffin', role: 'Security & Protection Specialist', avatar: '/placeholder.svg' },
  { name: 'SAL', role: 'System Administration Leader', avatar: '/placeholder.svg' },
  { name: 'LEO', role: 'Learning & Education Optimizer', avatar: '/placeholder.svg' },
  { name: 'SHA-1', role: 'Cryptographic Security Manager', avatar: '/placeholder.svg' },
  { name: 'Glitch', role: 'Creative Problem Solver', avatar: '/placeholder.svg' },
  { name: 'Scuba-Steve', role: 'Deep Data Diver', avatar: '/placeholder.svg' }
];

interface AIRosterProps {
  onAISelect?: (aiMember: any) => void;
}

const AIRoster: React.FC<AIRosterProps> = ({ onAISelect }) => {
  return (
    <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-full">
      <h3 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF] mb-6">
        AI Roster
      </h3>
      <div className="space-y-3">
        {aiTeamMembers.map((member, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#222222] 
                       transition-colors duration-300 cursor-pointer group"
            onClick={() => onAISelect && onAISelect(member)}
          >
            <div className="w-3 h-3 bg-[#00BFFF] rounded-full animate-pulse"></div>
            <span className="text-[#EAEAEA] group-hover:text-[#D900FF] transition-colors duration-300">
              {member.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRoster;