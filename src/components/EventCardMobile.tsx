import React from 'react';
import { MapPin, ArrowUpRight, Sparkles } from 'lucide-react';
import { TechEvent } from '../types/event';
import { GlowCard } from './ui/spotlight-card';

interface EventCardMobileProps {
  event: TechEvent;
  onSelectEvent: (event: TechEvent) => void;
}

export const EventCardMobile: React.FC<EventCardMobileProps> = ({
  event,
  onSelectEvent,
}) => {
  return (
    <GlowCard
      customSize
      glowColor="gold"
      className="bg-[#141414]/95 rounded-xl p-4 flex flex-col gap-3 group transition-all duration-300"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
          <Sparkles className="w-2.5 h-2.5" />
          {event.category}
        </span>
        <span className="text-[#ac834e] font-mono text-[11px]">
          {event.date}
        </span>
      </div>

      <div>
        <h4 className="font-bold text-white text-base group-hover:text-[#ac834e] transition-colors leading-snug">
          {event.title}
        </h4>
        <p className="text-xs text-white/70 mt-1 line-clamp-1">
          {event.tagline}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#ac834e]/20 text-xs text-white/70">
        <div className="flex items-center gap-1 truncate max-w-[170px]">
          <MapPin className="w-3 h-3 text-[#ac834e] flex-shrink-0" />
          <span className="truncate">{event.location.split('/')[0]}</span>
        </div>

        <button
          onClick={() => onSelectEvent(event)}
          className="inline-flex items-center gap-1 text-[#ac834e] hover:text-white font-bold text-xs tracking-wider uppercase"
        >
          <span>View</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </GlowCard>
  );
};

export default EventCardMobile;
