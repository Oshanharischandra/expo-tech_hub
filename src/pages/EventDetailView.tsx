import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Clock, MapPin, 
  Share2, Bookmark, CheckCircle2, Award, Sparkles, ShieldCheck 
} from 'lucide-react';
import { TechEvent } from '../types/event';
import { GlowCard } from '../components/ui/spotlight-card';

interface EventDetailViewProps {
  event: TechEvent;
  onBack: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({
  event,
  onBack,
}) => {
  const [registered, setRegistered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Navigation Back */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] text-white/80 hover:text-[#ac834e] border border-[#ac834e]/30 transition-all text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Conclave</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`p-2.5 rounded-xl border transition-all ${
              bookmarked
                ? 'bg-[#ac834e]/20 text-[#ac834e] border-[#ac834e]/50'
                : 'bg-[#141414] text-white/60 hover:text-[#ac834e] border-[#ac834e]/30'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2.5 rounded-xl bg-[#141414] text-white/60 hover:text-[#ac834e] border border-[#ac834e]/30 transition-all"
            title="Share event link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Detail Container Wrapped with GlowCard customSize */}
      <GlowCard
        customSize
        glowColor="gold"
        className="bg-[#141414]/95 rounded-3xl p-8 lg:p-10 shadow-2xl transition-all"
      >
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-[#ac834e]/30">
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
                  <Sparkles className="w-3.5 h-3.5 text-[#ac834e]" />
                  {event.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#1a1a1a] text-[#ac834e] border border-[#ac834e]/30">
                  {event.tier}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#1a1a1a] text-white/70 border border-[#ac834e]/20">
                  {event.format}
                </span>
              </div>

              <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 font-sans">
                {event.title}
              </h1>

              <p className="text-base lg:text-lg text-white/80 leading-relaxed font-light mb-6">
                {event.tagline}
              </p>
            </div>

            {/* Event Key Meta Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#ac834e]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ac834e]/15 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider">Date</div>
                  <div className="text-sm font-semibold text-white">{event.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ac834e]/15 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider">Schedule</div>
                  <div className="text-sm font-semibold text-white font-mono">{event.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ac834e]/15 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider">Venue</div>
                  <div className="text-sm font-semibold text-white truncate max-w-[140px]">
                    {event.location.split(',')[0]}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick RSVP Card */}
          <div className="bg-[#0e0e0e] rounded-2xl p-6 border border-[#ac834e]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#ac834e]/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Seat Allocation
                </span>
                <span className="text-xs font-mono text-[#ac834e] font-bold">
                  {event.maxCapacity - event.attendeesCount} seats remaining
                </span>
              </div>

              <div className="my-6">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">Current Registration</span>
                  <span className="text-[#ac834e] font-mono font-semibold">
                    {Math.round((event.attendeesCount / event.maxCapacity) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ac834e] rounded-full"
                    style={{
                      width: `${(event.attendeesCount / event.maxCapacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ac834e]" />
                  <span>VIP Access pass included</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ac834e]" />
                  <span>Interactive Live Hologram QA & Stream</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ac834e]" />
                  <span>Exclusive Archival Research Access</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setRegistered(!registered)}
              className={`w-full mt-6 py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 ${
                registered
                  ? 'bg-[#1a1a1a] text-[#ac834e] border border-[#ac834e]/50'
                  : 'bg-[#ac834e] text-[#0e0e0e] hover:bg-[#c49a62] shadow-gold-glow'
              }`}
            >
              {registered ? '✓ Reserved (VIP Access Active)' : 'Claim VIP Conclave Pass'}
            </button>
          </div>
        </div>

        {/* Body Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#ac834e]" />
                <span>Conclave Charter & Agenda</span>
              </h2>
              <p className="text-white/80 leading-relaxed text-sm lg:text-base font-light">
                {event.description}
              </p>
            </section>

            <section className="pt-4 border-t border-[#ac834e]/20">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#ac834e] mb-3">
                Key Topics & Disciplines
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-[#0e0e0e] text-xs font-medium text-white border border-[#ac834e]/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Keynote Speakers Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ac834e]" />
              <span>Keynote Faculty</span>
            </h2>

            <div className="space-y-3">
              {event.speakers.map((spk, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-[#0e0e0e] border border-[#ac834e]/30"
                >
                  <img
                    src={spk.avatar}
                    alt={spk.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#ac834e]/40"
                  />
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {spk.name}
                    </h4>
                    <p className="text-xs text-[#ac834e] font-medium">{spk.role}</p>
                    <p className="text-[11px] text-white/60">{spk.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

export default EventDetailView;
