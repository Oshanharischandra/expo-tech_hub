import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Ticket, Calendar, Clock, MapPin, Building2 } from 'lucide-react';
import { TechEvent } from '../types/event';

interface EventDetailsModalProps {
  event: TechEvent;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Clean, Spacious Minimalist Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="relative w-full max-w-xl bg-[#121212] border border-[#ac834e]/40 rounded-3xl p-6 sm:p-8 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(172,131,78,0.15)] z-10 overflow-hidden"
          >
            {/* Subtle Gold Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#ac834e]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Pill Badge & Close Button */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#ac834e]/15 text-[#c49a62] border border-[#ac834e]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e] animate-pulse" />
                Upcoming Conclave • {event.format}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug mb-5">
              {event.title}
            </h3>

            {/* Event Logistics: Clean, Legible Key-Value Rows */}
            <div className="space-y-3 py-4 border-y border-[#ac834e]/20 mb-5">
              <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-[#ac834e] w-20 sm:w-24 flex-shrink-0 font-mono text-[11px] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Date</span>
                </div>
                <div className="text-white font-medium">{event.date}</div>
              </div>

              <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-[#ac834e] w-20 sm:w-24 flex-shrink-0 font-mono text-[11px] uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Time</span>
                </div>
                <div className="text-white/90">{event.time}</div>
              </div>

              <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-[#ac834e] w-20 sm:w-24 flex-shrink-0 font-mono text-[11px] uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Venue</span>
                </div>
                <div className="text-white/90 leading-normal">{event.location}</div>
              </div>
            </div>

            {/* Event Summary (Spacious & Clean) */}
            <div className="mb-5">
              <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Organizer Note */}
            <div className="text-xs text-white/50 mb-7 pt-4 border-t border-white/10 flex flex-wrap items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#ac834e] flex-shrink-0" />
              <span>Organized by</span>
              <span className="text-white font-medium">Tech HUB Conclave Executive Council</span>
              <span className="text-white/30">•</span>
              <span className="text-[#c49a62]">Cognitive Dynamics Labs</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/article/autonomous-systems-llm-conclave-2026"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] text-white/90 hover:text-white border border-[#ac834e]/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors text-center"
              >
                <BookOpen className="w-4 h-4 text-[#ac834e]" />
                <span>More Details</span>
              </Link>

              <Link
                to="/event/ai-conclave-2026/register"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#ac834e] hover:bg-[#c49a62] text-[#0e0e0e] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold-glow-sm active:scale-95 transition-all text-center"
              >
                <Ticket className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
