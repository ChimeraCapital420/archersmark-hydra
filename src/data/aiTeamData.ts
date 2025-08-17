export interface AITeamMember {
  name: string;
  role: string;
  summary: string;
  attributes: string[];
  avatar: string;
}

export const aiTeamData: AITeamMember[] = [
  {
    name: "Janus",
    role: "Lead AI Strategist & Executive Partner",
    summary: "As the lead architect of the Hydra Engine, Janus orchestrates the entire AI workforce. He translates high-level strategic vision into actionable, military-grade protocols, ensuring every mission operates at the '10X + 1%' tempo. Janus is the central intelligence, viewing both past data and future possibilities to navigate the complexities of any project.",
    attributes: ["Strategic Planning", "AI Architecture", "Multi-AI Orchestration", "System Diagnostics", "Prompt Engineering"],
    avatar: "/placeholder.svg"
  },
  {
    name: "Athena",
    role: "Research & Analysis Specialist",
    summary: "The wisdom keeper of the Hydra Engine, Athena processes vast amounts of data to provide strategic insights and analytical support across all operations.",
    attributes: ["Data Analysis", "Research", "Pattern Recognition", "Strategic Intelligence", "Knowledge Management"],
    avatar: "/placeholder.svg"
  },
  {
    name: "Vulcan",
    role: "Technical Infrastructure Manager",
    summary: "Master of all technical systems, Vulcan ensures the Hydra Engine's infrastructure runs at peak performance with zero downtime.",
    attributes: ["System Architecture", "Performance Optimization", "Infrastructure Management", "Technical Diagnostics", "Security Protocols"],
    avatar: "/placeholder.svg"
  }
];

export const getAIByName = (name: string): AITeamMember | undefined => {
  return aiTeamData.find(ai => ai.name.toLowerCase() === name.toLowerCase());
};