import React, { useState, useEffect } from 'react';
import { aiTeamData } from '@/data/aiTeamData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Workshop: React.FC = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('hydraVoiceSettings');
      return savedSettings ? JSON.parse(savedSettings) : {};
    }
    return {};
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceChange = (personaName: string, voiceURI: string) => {
    const newSettings = { ...voiceSettings, [personaName]: voiceURI };
    setVoiceSettings(newSettings);
    localStorage.setItem('hydraVoiceSettings', JSON.stringify(newSettings));
    toast.success(`Voice for ${personaName} has been updated.`);
  };
  
  const handleTestVoice = (personaName: string) => {
    const voiceURI = voiceSettings[personaName];
    const voice = voices.find(v => v.voiceURI === voiceURI);
    if (voice) {
        const utterance = new SpeechSynthesisUtterance(`This is the selected voice for ${personaName}.`);
        utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    } else {
        toast.error("Please select a voice first.");
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold font-['Orbitron'] text-[#00BFFF] mb-8 text-center">
          AI Voice Workshop
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiTeamData.map((persona) => (
            <Card key={persona.name} className="bg-[#1A1A1A] border-[#444444] text-white">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={persona.avatar} alt={persona.name} />
                  <AvatarFallback>{persona.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg text-gray-200">{persona.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={voiceSettings[persona.name]}
                  onValueChange={(value) => handleVoiceChange(persona.name, value)}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select a voice..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                    {voices.map((voice) => (
                      <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => handleTestVoice(persona.name)}>
                    Test Voice
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workshop;