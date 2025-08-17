import React, { useState, useEffect } from 'react';

const commMessages = [
  '[Janus > Athena]: Cross-referencing market data...',
  '[Vulcan > System]: Hardware diagnostics nominal...',
  '[Aegle > System]: Biometric analysis complete...',
  '[Lexicoda > Orion]: Language processing optimized...',
  '[Cerebro > Griffin]: Neural pathway mapping active...',
  '[SAL > LEO]: Satellite uplink established...',
  '[SHA-1 > System]: Security protocols updated...',
  '[Glitch > Scuba-Steve]: Anomaly detection running...',
  '[Athena > Vulcan]: Strategic analysis in progress...',
  '[Orion > Janus]: Navigation systems synchronized...',
  '[Griffin > Aegle]: Threat assessment complete...',
  '[LEO > SHA-1]: Encryption keys rotated...',
  '[Scuba-Steve > System]: Deep scan initiated...',
  '[System > All]: Network integrity verified...'
];

const LiveCommsLog: React.FC = () => {
  const [messages, setMessages] = useState(commMessages.slice(0, 8));
  const [messageIndex, setMessageIndex] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => {
        const newMessages = [...prev.slice(1), commMessages[messageIndex % commMessages.length]];
        return newMessages;
      });
      setMessageIndex(prev => (prev + 1) % commMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messageIndex]);

  return (
    <div className="bg-[#1A1A1A] border border-[#444444] rounded-lg p-6 h-full">
      <h3 className="text-xl font-bold font-['Orbitron'] text-[#00BFFF] mb-6">
        Network Comms
      </h3>
      <div className="bg-black rounded-lg p-4 h-96 overflow-hidden">
        <div className="space-y-2 font-mono text-sm">
          {messages.map((message, index) => (
            <div
              key={`${message}-${index}`}
              className="text-[#00FF00] opacity-80 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveCommsLog;