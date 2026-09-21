import React from 'react';
import { Calendar, MapPin, Users, ArrowUpRight, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { TechEvent } from '../types/event';
import { GlowCard } from './ui/spotlight-card';

interface EventCardProps {
  event: TechEvent;
  onSelectEvent: (event: TechEvent) => void;
  onAddToCart?: (event: TechEvent) => void;
  isInCart?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelectEvent,
  onAddToCart,
  isInCart = false,
}) => {
  const percentageFull = Math.min(100, Math.round((event.attendeesCount / event.maxCapacity) * 100));

  return (
    <GlowCard
      customSize
      glowColor="gold"
      className="bg-[#141414]/95 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:shadow-gold-glow border border-[#ac834e]/25"
    >
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Meta Bar */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
              <Sparkles className="w-3 h-3 text-[#ac834e]" />
              {event.category}
            </span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#ac834e] border border-[#ac834e]/30">
              {event.tier}
            </span>
          </div>

          {/* Thumbnail / Ambient Image Header */}
          <div className="relative h-44 -mx-6 mb-5 overflow-hidden border-y border-[#ac834e]/30 bg-[#0e0e0e]">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-95 transition-all duration-500"
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
          <h3
            onClick={() => onSelectEvent(event)}
            className="text-xl font-bold text-white group-hover:text-[#ac834e] transition-colors line-clamp-2 mb-2 tracking-tight cursor-pointer font-serif"
          >
            {event.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/70 line-clamp-2 mb-4 leading-relaxed font-light">
            {event.tagline}
          </p>
        </div>

        <div>
          {/* Capacity Progress Bar */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] text-white/60">
              <span className="flex items-center gap-1 text-[#ac834e] font-mono">
                <Users className="w-3 h-3" />
                {event.attendeesCount} / {event.maxCapacity} seats
              </span>
              <span className="font-mono text-[#ac834e] font-semibold">{percentageFull}% Reserved</span>
            </div>
            <div className="w-full h-1.5 bg-[#202020] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8e6939] to-[#ac834e] rounded-full transition-all duration-500"
                style={{ width: `${percentageFull}%` }}
              />
            </div>
          </div>

          {/* Keynote Speakers Row */}
          <div className="pt-3 border-t border-[#ac834e]/20 flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {event.speakers.map((spk, idx) => (
                  <img
                    key={idx}
                    src={spk.avatar}
                    alt={spk.name}
                    title={`${spk.name} (${spk.role}, ${spk.company})`}
                    className="w-7 h-7 rounded-full border border-[#ac834e]/60 object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-white font-medium truncate max-w-[130px]">
                {event.speakers[0]?.name}
                {event.speakers.length > 1 ? ` +${event.speakers.length - 1}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-white/60 truncate max-w-[120px]">
              <MapPin className="w-3 h-3 text-[#ac834e] flex-shrink-0" />
              <span className="truncate">{event.location.split(',')[0]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer with Cart & Details */}
      <div className="px-6 py-4 bg-[#0e0e0e]/95 border-t border-[#ac834e]/30 flex items-center justify-between gap-3">
        <button
          onClick={() => onSelectEvent(event)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <span>Agenda & Info</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#ac834e]" />
        </button>

        {onAddToCart && (
          <button
            onClick={() => onAddToCart(event)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
              isInCart
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-[#ac834e] hover:bg-[#c49a62] text-[#0e0e0e] shadow-gold-glow-sm hover:scale-[1.02] active:scale-95'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Pass In Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Reserve Pass</span>
              </>
            )}
          </button>
        )}
      </div>
    </GlowCard>
  );
};

export default EventCard;
