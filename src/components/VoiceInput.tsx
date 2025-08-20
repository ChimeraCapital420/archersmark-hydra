import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceInputProps {
  onFinalTranscript: (transcript: string) => void;
  onInterimTranscript: (transcript: string) => void;
  className?: string;
}

// Check for browser support outside the component
const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

const VoiceInput: React.FC<VoiceInputProps> = ({ onFinalTranscript, onInterimTranscript, className }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          onInterimTranscript(event.results[i][0].transcript);
        }
      }
      if (finalTranscript) {
        onFinalTranscript(finalTranscript);
      }
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Speech recognition error", { description: event.error });
        setIsListening(false);
    };
    
    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onFinalTranscript, onInterimTranscript]);

  const handleToggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  if (!SpeechRecognition) {
    return null; // Don't render the button if the browser doesn't support it
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(className, isListening ? "text-red-500 border-red-500 animate-pulse" : "text-gray-400")}
      onClick={handleToggleListening}
      title={isListening ? "Stop dictation" : "Start dictation"}
    >
      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  );
};

export default VoiceInput;