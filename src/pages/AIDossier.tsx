import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { getAIByName } from '@/data/aiTeamData';

const AIDossier: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  
  if (!name) {
    return <Navigate to="/not-found" replace />;
  }

  const aiMember = getAIByName(name);
  
  if (!aiMember) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#1A1A1A] text-[#EAEAEA]">
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Avatar Display */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg p-8 border border-[#444444]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00BFFF]/10 to-[#D900FF]/10 rounded-lg animate-pulse"></div>
                <img 
                  src={aiMember.avatar} 
                  alt={aiMember.name}
                  className="relative z-10 w-full max-w-md mx-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>

            {/* Right Column: Dossier Information */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl font-bold font-['Orbitron'] text-[#EAEAEA] mb-4">
                  {aiMember.name}
                </h1>
                <h3 className="text-2xl font-['Inter'] text-[#00BFFF] mb-6">
                  {aiMember.role}
                </h3>
              </div>

              <div>
                <p className="text-lg leading-relaxed text-[#CCCCCC] mb-8">
                  {aiMember.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold font-['Orbitron'] text-[#EAEAEA] mb-4">
                  Key Attributes
                </h4>
                <ul className="space-y-3">
                  {aiMember.attributes.map((attribute, index) => (
                    <li key={index} className="flex items-center text-[#CCCCCC]">
                      <span className="w-2 h-2 bg-[#D900FF] rounded-full mr-4"></span>
                      {attribute}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIDossier;