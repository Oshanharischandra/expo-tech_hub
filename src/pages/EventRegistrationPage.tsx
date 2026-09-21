import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  Ticket,
  User,
  Mail,
  Building,
  Briefcase,
  QrCode,
  Download,
  Share2
} from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { TechEvent } from '../types/event';
import { GlowCard } from '../components/ui/spotlight-card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

const EventRegistrationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();

  const [event, setEvent] = useState<TechEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<'executive' | 'virtual'>('executive');
  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    email: authState.user?.email || '',
    organization: '',
    title: '',
    linkedin: '',
    dietary: 'none',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [registrationCode, setRegistrationCode] = useState('');

  useEffect(() => {
    // Find matching event or fallback to first
    const found = mockEvents.find(e => e.id === eventId || e.slug === eventId) || mockEvents[0];
    setEvent(found);
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showError('Please provide your name and email address');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const code = `TH-PASS-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
      setRegistrationCode(code);
      setIsSubmitting(false);
      setIsConfirmed(true);
      showSuccess('Registration confirmed! Your pass is ready.');
    }, 600);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-white">
        <p className="text-white/60">Loading event registration...</p>
      </div>
    );
  }

  // Related magazine article slug
  const articleSlug = 'autonomous-systems-llm-conclave-2026';

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation / Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[#ac834e]/20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-[#ac834e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Direct Link to Event's Full Magazine Article */}
          <Link
            to={`/article/${articleSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] text-[#ac834e] hover:text-[#c49a62] border border-[#ac834e]/30 transition-all text-xs font-bold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read Event Magazine Article & Whitepaper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Confirmation Screen */}
        <AnimatePresence>
          {isConfirmed ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <GlowCard
                customSize
                glowColor="gold"
                className="bg-[#121212] border border-[#ac834e]/50 rounded-3xl p-8 sm:p-10 shadow-gold-glow text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-[#ac834e]/20 border border-[#ac834e] flex items-center justify-center mx-auto text-[#ac834e]">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-[11px] font-mono tracking-widest uppercase px-3.5 py-1 rounded-full bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 inline-block mb-3 font-semibold">
                    Verified Delegate Pass Issued
                  </span>
                  <h1 className="text-3xl font-serif font-bold text-white mb-2">
                    Registration Confirmed
                  </h1>
                  <p className="text-sm text-white/70 font-light max-w-md mx-auto">
                    Welcome to the <strong>{event.title}</strong> fellowship. Your delegate credentials have been registered on the Tech HUB Merkle ledger.
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="p-6 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-2xl text-left space-y-4 font-mono text-xs relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#ac834e]/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ac834e]" />
                      <span className="text-white font-bold tracking-wider uppercase">TECH HUB CONCLAVE PASS</span>
                    </div>
                    <span className="text-[#ac834e] font-bold uppercase">{selectedTier} TIER</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-white/50 uppercase">DELEGATE NAME</div>
                      <div className="text-white font-bold text-sm mt-0.5">{formData.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50 uppercase">CREDENTIAL ID</div>
                      <div className="text-[#ac834e] font-bold text-sm mt-0.5">{registrationCode}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50 uppercase">DATE & TIME</div>
                      <div className="text-white/80 mt-0.5">{event.date} • {event.time.split('-')[0]}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/50 uppercase">VENUE / LOCATION</div>
                      <div className="text-white/80 mt-0.5">{event.location.split(',')[0]}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#ac834e]/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-sans">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Cryptographically Signed Pass</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <QrCode className="w-6 h-6 text-[#ac834e]" />
                      <span className="text-[10px]">SCAN AT ENTRANCE</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] text-white/90 border border-[#ac834e]/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#ac834e]" />
                    <span>Download / Print Pass</span>
                  </button>
                  <Link
                    to={`/article/${articleSlug}`}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ac834e] hover:bg-[#c49a62] text-[#0e0e0e] text-xs font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Full Magazine Article</span>
                  </Link>
                </div>
              </GlowCard>
            </motion.div>
          ) : (
            /* Registration Form View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Event Summary & Magazine Article Link (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                <GlowCard
                  customSize
                  glowColor="gold"
                  className="bg-[#121212] border border-[#ac834e]/30 rounded-3xl p-6 sm:p-7 shadow-lg"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
                        {event.tier}
                      </span>
                      <span className="text-xs text-white/60 font-mono">
                        {event.format}
                      </span>
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-white leading-tight">
                      {event.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed">
                      {event.tagline}
                    </p>

                    <div className="space-y-2.5 pt-3 border-t border-[#ac834e]/20 text-xs text-white/70">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#ac834e] flex-shrink-0" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#ac834e] flex-shrink-0" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#ac834e] flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {/* Keynote Speakers */}
                    <div className="pt-4 border-t border-[#ac834e]/20">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#ac834e] font-bold mb-3">
                        Keynote Leadership
                      </h4>
                      <div className="space-y-2.5">
                        {event.speakers.map((spk, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <img
                              src={spk.avatar}
                              alt={spk.name}
                              className="w-10 h-10 rounded-full border border-[#ac834e]/40 object-cover"
                            />
                            <div>
                              <div className="font-semibold text-white text-xs">{spk.name}</div>
                              <div className="text-[11px] text-[#ac834e]">{spk.role} • {spk.company}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Link to Full Magazine Article Callout */}
                    <div className="pt-5 border-t border-[#ac834e]/25">
                      <div className="p-4 rounded-2xl bg-[#161616] border border-[#ac834e]/20 space-y-2">
                        <div className="flex items-center gap-2 text-[#ac834e] text-xs font-bold uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" />
                          <span>Event Magazine Feature</span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed font-light">
                          Explore the comprehensive whitepaper, architecture blueprints, and 3-pillar breakdown before the live session.
                        </p>
                        <Link
                          to={`/article/${articleSlug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ac834e] hover:text-[#c49a62] pt-1 transition-colors"
                        >
                          <span>Open Full Magazine Article</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </div>

              {/* Right Column: Registration Passes & Attendee Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Select Pass Tier */}
                <div className="space-y-3">
                  <h3 className="text-sm font-mono uppercase tracking-wider text-[#ac834e] font-bold flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span>1. Select Access Pass Tier</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Executive Pass */}
                    <div
                      onClick={() => setSelectedTier('executive')}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTier === 'executive'
                          ? 'bg-[#181818] border-[#ac834e] shadow-gold-glow-sm'
                          : 'bg-[#121212] border-[#ac834e]/20 hover:border-[#ac834e]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Executive Delegate</span>
                        <div className="text-xl font-mono font-bold text-[#ac834e]">$499</div>
                      </div>
                      <p className="text-xs text-white/60 font-light mb-3">
                        Full in-person floor access, private speaker networking, and certified Merkle credentials.
                      </p>
                      <div className="text-[11px] text-[#ac834e] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In-Person + Hybrid Access</span>
                      </div>
                    </div>

                    {/* Virtual Pass */}
                    <div
                      onClick={() => setSelectedTier('virtual')}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selectedTier === 'virtual'
                          ? 'bg-[#181818] border-[#ac834e] shadow-gold-glow-sm'
                          : 'bg-[#121212] border-[#ac834e]/20 hover:border-[#ac834e]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Virtual Stage</span>
                        <div className="text-xl font-mono font-bold text-white">FREE</div>
                      </div>
                      <p className="text-xs text-white/60 font-light mb-3">
                        Live 4K stream broadcast, interactive session Q&A submission, and digital replay access.
                      </p>
                      <div className="text-[11px] text-white/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Global Holographic Stream</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendee Form */}
                <GlowCard
                  customSize
                  glowColor="gold"
                  className="bg-[#121212] border border-[#ac834e]/30 rounded-3xl p-6 sm:p-8"
                >
                  <h3 className="text-sm font-mono uppercase tracking-wider text-[#ac834e] font-bold mb-5 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>2. Delegate Accreditation Information</span>
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/70 mb-1.5 font-medium">
                          Full Name *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Dr. Alex Mercer"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-xl text-xs text-white focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                          />
                          <User className="w-4 h-4 text-[#ac834e] absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 mb-1.5 font-medium">
                          Work Email Address *
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="alex@cognitivelabs.ai"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-xl text-xs text-white focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                          />
                          <Mail className="w-4 h-4 text-[#ac834e] absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/70 mb-1.5 font-medium">
                          Organization / Company
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleInputChange}
                            placeholder="e.g. Cognitive Dynamics"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-xl text-xs text-white focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                          />
                          <Building className="w-4 h-4 text-[#ac834e] absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-white/70 mb-1.5 font-medium">
                          Role / Title
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Staff Research Scientist"
                            className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-xl text-xs text-white focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                          />
                          <Briefcase className="w-4 h-4 text-[#ac834e] absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white/70 mb-1.5 font-medium">
                        Dietary & Accessibility Requirements (In-Person Delegates)
                      </label>
                      <select
                        name="dietary"
                        value={formData.dietary}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 bg-[#0c0c0c] border border-[#ac834e]/30 rounded-xl text-xs text-white focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                      >
                        <option value="none">Standard Executive Catering</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="vegan">Vegan</option>
                        <option value="gluten-free">Gluten-Free</option>
                        <option value="halal">Halal</option>
                        <option value="kosher">Kosher</option>
                      </select>
                    </div>

                    {/* Summary & Submit */}
                    <div className="pt-4 border-t border-[#ac834e]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-left">
                        <div className="text-[11px] text-white/50 uppercase font-mono">TOTAL INVESTMENT</div>
                        <div className="text-xl font-bold font-mono text-[#ac834e]">
                          {selectedTier === 'executive' ? '$499 USD' : 'COMPLIMENTARY'}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ac834e] hover:bg-[#c49a62] text-[#0e0e0e] font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-[#0e0e0e] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Complete Event Registration</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </GlowCard>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EventRegistrationPage;
