import React, { useState } from 'react';
import { X, Send, Camera, Paperclip, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiMember: {
    name: string;
    avatar: string;
    role: string;
  };
}

export function ChatModal({ isOpen, onClose, aiMember }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello! I'm ${aiMember.name}. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand your directive: "${inputValue}". Processing request...`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl h-[600px] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-700">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={aiMember.avatar} alt={aiMember.name} />
            <AvatarFallback>{aiMember.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-orbitron text-lg text-white">{aiMember.name}</h3>
            <p className="text-sm text-blue-400">{aiMember.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-white border border-blue-400'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-600 px-3 py-2">
            {/* Camera Icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 p-1 h-auto transition-all duration-200"
              onClick={() => console.log('Camera activated')}
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            {/* Paperclip Icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 p-1 h-auto transition-all duration-200"
              onClick={() => console.log('File upload activated')}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            {/* Input Field */}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send a directive..."
              className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            
            {/* Microphone Icon */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-pink-400 hover:bg-pink-400/10 p-1 h-auto transition-all duration-200"
              onClick={() => console.log('Voice input activated')}
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              className="bg-blue-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 text-white p-2 h-auto transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}