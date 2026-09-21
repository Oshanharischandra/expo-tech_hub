import React from 'react';
import { Calendar, MapPin, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { TechEvent } from '../types/event';
import { GlowCard } from './ui/spotlight-card';

interface EventCardProps {
  event: TechEvent;
  onSelectEvent: (event: TechEvent) => void;
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelectEvent,
}) => {
  return (
    <GlowCard
      customSize
      glowColor="gold"
      className="bg-[#141414]/95 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-gold-glow"
    >
      <div className="p-6">
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
            <Sparkles className="w-3 h-3 text-[#ac834e]" />
            {event.category}
          </span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#ac834e] border border-[#ac834e]/30">
            {event.tier}
          </span>
        </div>

        {/* Thumbnail / Ambient Image Header */}
        <div className="relative h-44 -mx-6 -mt-1 mb-5 overflow-hidden border-y border-[#ac834e]/30 bg-[#0e0e0e]">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-75 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
          <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between text-xs text-white font-mono">
            <span className="flex items-center gap-1.5 bg-[#0e0e0e]/90 px-2.5 py-1 rounded-md border border-[#ac834e]/30 backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-[#ac834e]" />
              {event.date}
            </span>
            <span className="flex items-center gap-1 bg-[#0e0e0e]/90 px-2.5 py-1 rounded-md border border-[#ac834e]/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#ac834e] animate-pulse" />
              {event.format}
            </span>
          </div>
        </div>

        {/* Title and Tagline */}
        <h3 className="text-xl font-bold text-white group-hover:text-[#ac834e] transition-colors line-clamp-2 mb-2 tracking-tight">
          {event.title}
        </h3>
        <p className="text-sm text-white/70 line-clamp-2 mb-4 leading-relaxed">
          {event.tagline}
        </p>

        {/* Speakers & Capacity Row */}
        <div className="pt-4 border-t border-[#ac834e]/20 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.speakers.map((spk, idx) => (
                <img
                  key={idx}
                  src={spk.avatar}
                  alt={spk.name}
                  title={`${spk.name} (${spk.role}, ${spk.company})`}
                  className="w-7 h-7 rounded-full border border-[#ac834e]/50 object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-white font-medium">
              {event.speakers[0]?.name}
              {event.speakers.length > 1 ? ` +${event.speakers.length - 1}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#ac834e] font-mono font-medium">
            <Users className="w-3.5 h-3.5 text-[#ac834e]" />
            <span>
              {event.attendeesCount}/{event.maxCapacity}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-[#0e0e0e]/90 border-t border-[#ac834e]/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-white/70 truncate max-w-[200px]">
          <MapPin className="w-3.5 h-3.5 text-[#ac834e] flex-shrink-0" />
          <span className="truncate">{event.location.split(',')[0]}</span>
        </div>

        <button
          onClick={() => onSelectEvent(event)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0e0e0e] bg-[#ac834e] hover:bg-[#c49a62] rounded-lg shadow-gold-glow-sm transition-all duration-200"
        >
          <span>Explore</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlowCard>
  );
};

export default EventCard;
