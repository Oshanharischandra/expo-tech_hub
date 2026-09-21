export interface Speaker {
  name: string;
  role: string;
  company: string;
  avatar: string;
}

export interface TechEvent {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'AI & Neural Tech' | 'Web3 & Fintech' | 'Cloud & Distributed' | 'Cyber Architecture' | 'Quantum & Deep Tech';
  date: string;
  time: string;
  location: string;
  format: 'In-Person' | 'Hybrid' | 'Virtual Keynote';
  tier: 'VIP Conclave' | 'Executive Summit' | 'Developer Masterclass';
  attendeesCount: number;
  maxCapacity: number;
  featured: boolean;
  speakers: Speaker[];
  tags: string[];
  bannerUrl: string;
}
