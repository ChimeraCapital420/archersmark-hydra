import React from 'react';

const Knowledge: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-['Orbitron'] text-[#00BFFF] mb-2 text-center">
          Hydra Knowledge Base
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Upload documents to provide your AI team with long-term memory and strategic context.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div className="bg-[#1A1A1A] border border-dashed border-[#444444] rounded-lg p-8 flex flex-col items-center justify-center h-96 hover:border-[#00BFFF] transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Drag & Drop Files Here</h3>
            <p className="text-gray-500">or click to browse</p>
            <input type="file" className="absolute w-full h-full opacity-0 cursor-pointer" multiple />
          </div>

          {/* Uploaded Files List */}
          <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-96 flex flex-col">
              <h3 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF] mb-6">
                Uploaded Documents
              </h3>
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">No documents uploaded yet.</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Knowledge;