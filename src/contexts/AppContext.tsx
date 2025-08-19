import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => {
    // Get the initial state from localStorage, defaulting to true (on)
    if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('speechEnabled');
        return savedState !== null ? JSON.parse(savedState) : true;
    }
    return true;
  });

  useEffect(() => {
    // Save the state to localStorage whenever it changes
    localStorage.setItem('speechEnabled', JSON.stringify(isSpeechEnabled));
  }, [isSpeechEnabled]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        isSpeechEnabled,
        toggleSpeech,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};