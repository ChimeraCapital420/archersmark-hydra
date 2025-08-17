import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const Knowledge: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    const file = acceptedFiles[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}"...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload_knowledge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Upload failed');
      }
      
      toast.success(`"${file.name}" processed successfully.`, {
        id: toastId,
        description: `${result.chunks} text chunks indexed for the AI team.`,
      });
      setUploadedFiles(prev => [...prev, file.name]);

    } catch (error: any) {
      console.error(error);
      toast.error(`Upload failed for "${file.name}"`, {
        id: toastId,
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: uploading,
  });

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
          <div
            {...getRootProps()}
            className={`bg-[#1A1A1A] border border-dashed border-[#444444] rounded-lg p-8 flex flex-col items-center justify-center h-96 transition-colors duration-300 ${isDragActive ? 'border-[#00BFFF]' : 'hover:border-[#00BFFF]'} ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} />
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {uploading ? 'Processing...' : isDragActive ? 'Drop the file to begin processing' : 'Drag & Drop a File Here'}
            </h3>
            <p className="text-gray-500">
              {uploading ? 'Indexing for AI team...' : 'or click to browse'}
            </p>
          </div>

          {/* Uploaded Files List */}
          <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-96 flex flex-col">
            <h3 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF] mb-6">
              Indexed Documents
            </h3>
            <div className="flex-grow overflow-y-auto">
              {uploadedFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {uploadedFiles.map((name, index) => (
                    <li key={index} className="bg-[#222222] p-3 rounded-md text-gray-300 text-sm">
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Knowledge;