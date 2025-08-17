import React from 'react';

interface AITeamMember {
  name: string;
  image: string;
}

const aiTeamMembers: AITeamMember[] = [
  { name: 'Janus', image: '/images/Janus.jpg' },
  { name: 'Athena', image: '/images/Athena.jpg' },
  { name: 'Vulcan', image: '/images/Vulcan.jpg' },
  { name: 'Aegle', image: '/images/Aegle.jpg' },
  { name: 'Lexicoda', image: '/images/Lexicoda.jpg' },
  { name: 'Legolas', image: '/images/Legolas.jpg' },
  { name: 'Orion', image: '/images/Orion.jpg' },
  { name: 'Cerebro', image: '/images/Cerebro.jpg' },
  { name: 'Griffin', image: '/images/Griffin.jpg' },
  { name: 'SAL', image: '/images/SAL.jpg' },
  { name: 'LEO', image: '/images/LEO.jpg' },
  { name: 'SHA-1', image: '/images/SHA-1.jpg' },
  { name: 'Glitch', image: '/images/Glitch.jpg' },
  { name: 'Scuba-Steve', image: '/images/Scuba-Steve.jpg' }
];

const AITeamShowcase: React.FC = () => {
  return (
    <section className="py-16">
      <h2 className="text-4xl font-bold text-center mb-12 font-['Orbitron'] text-[#00BFFF]">
        Meet the Hydra Engine
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
        {aiTeamMembers.map((member, index) => (
          <div
            key={index}
            className="bg-[#1A1A1A] border border-[#00BFFF] rounded-lg p-6 text-center 
                       hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] hover:scale-105 
                       transition-all duration-300 cursor-pointer group"
          >
            <div className="mb-4 flex justify-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#00BFFF] 
                           group-hover:border-[#D900FF] transition-colors duration-300"
              />
            </div>
            <h3 className="text-xl font-semibold font-['Orbitron'] text-[#00BFFF] 
                           group-hover:text-[#D900FF] transition-colors duration-300">
              {member.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AITeamShowcase;