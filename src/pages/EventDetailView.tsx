import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import supabase from '../services/supabaseClient';
import { editorService } from '../services/editorService';
import { Event } from '../types/payload';
import { eventsService } from '../services/eventsService';
import LoadingSpinner from '../components/LoadingSpinner';
import { GlowCard } from '../components/ui/spotlight-card';

const EventDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; passed: boolean } | null>(null);

  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (data && (data.role === 'admin' || data.role === 'co-admin')) {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Failed to check admin status', e);
      }
    };
    checkAdmin();
  }, []);

  const handleAdminAction = async (action: 'approve' | 'reject' | 'archive') => {
    if (!event) return;
    if (!window.confirm(`Are you sure you want to ${action} this event?`)) return;
    
    setIsProcessingAction(true);
    try {
      if (action === 'approve') {
        await editorService.approveEvent(event.id);
      } else if (action === 'reject') {
        const reason = prompt('Please provide a reason for rejection (optional):');
        if (reason === null) {
          setIsProcessingAction(false);
          return;
        }
        await editorService.rejectEvent(event.id, reason || undefined);
      } else if (action === 'archive') {
        await editorService.archiveEvent(event.id);
      }
      navigate('/editor');
    } catch (e) {
      alert(`Failed to ${action} event`);
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        const data = await eventsService.getById(id);
        setEvent(data);
      } catch (error) {
        console.error('Failed to fetch event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!event?.important_dates || event.important_dates.length === 0) return;
    
    const getPrimaryOrNearestDate = (dates: any[]) => {
      let target = dates.find(d => d.is_primary);
      if (!target) {
        const now = new Date().getTime();
        const upcoming = dates
          .map(d => ({ ...d, time: new Date(d.date_value || d.date).getTime() }))
          .filter(d => !isNaN(d.time) && d.time > now)
          .sort((a, b) => a.time - b.time);
        target = upcoming[0] || dates[0];
      }
      return target;
    };

    const targetDateObj = getPrimaryOrNearestDate(event.important_dates);
    if (!targetDateObj) return;
    const targetTime = new Date(targetDateObj.date_value || targetDateObj.date).getTime();
    if (isNaN(targetTime)) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, passed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown({ days, hours, minutes, passed: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [event]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
          <p className="text-gray-400 mb-8">The event you are looking for does not exist.</p>
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to={isAdmin ? "/editor" : "/"} className="text-primary-500 hover:text-primary-400 font-medium mb-6 inline-block">
          &larr; Back to {isAdmin ? "Dashboard" : "Events"}
        </Link>
        
        {isAdmin && (
          <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold mb-1">OC Admin Controls</h3>
              <p className="text-sm text-gray-400">Current Status: <span className="font-bold text-white uppercase">{event.status}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {event.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleAdminAction('approve')}
                    disabled={isProcessingAction}
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-900/20 text-green-400 border border-green-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-900/40 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAdminAction('reject')}
                    disabled={isProcessingAction}
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-900/40 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {event.status === 'approved' && (
                <button
                  onClick={() => handleAdminAction('archive')}
                  disabled={isProcessingAction}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-900/20 text-orange-400 border border-orange-900/30 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-900/40 transition-colors disabled:opacity-50"
                >
                  Archive
                </button>
              )}
            </div>
          </div>
        )}
        
        <GlowCard customSize glowColor="gold" className="!p-0 overflow-hidden shadow-lg border-0">
          {event.cover_image && (
            <div className="w-full h-64 md:h-96 relative">
              <img
                src={event.cover_image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent opacity-80" />
            </div>
          )}
          
          <div className="p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="bg-primary-900/50 text-primary-300 px-3 py-1 rounded-full text-sm font-medium border border-primary-500/20">
                {event.category}
              </span>
            </div>

            {countdown && !countdown.passed && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 bg-dark-800/50 p-4 rounded-xl border border-dark-700/50 inline-flex shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Countdown</span>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center bg-dark-900 border border-dark-800 rounded-lg min-w-[64px] py-2 px-1 shadow-inner">
                    <span className="text-2xl font-bold text-primary-400 leading-none mb-1">{countdown.days}</span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Days</span>
                  </div>
                  <span className="text-dark-700 font-bold pb-4">:</span>
                  <div className="flex flex-col items-center justify-center bg-dark-900 border border-dark-800 rounded-lg min-w-[64px] py-2 px-1 shadow-inner">
                    <span className="text-2xl font-bold text-primary-400 leading-none mb-1">{countdown.hours.toString().padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Hrs</span>
                  </div>
                  <span className="text-dark-700 font-bold pb-4">:</span>
                  <div className="flex flex-col items-center justify-center bg-dark-900 border border-dark-800 rounded-lg min-w-[64px] py-2 px-1 shadow-inner">
                    <span className="text-2xl font-bold text-primary-400 leading-none mb-1">{countdown.minutes.toString().padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Mins</span>
                  </div>
                </div>
              </div>
            )}

            {countdown && countdown.passed && (
              <div className="mb-8">
                <span className="bg-dark-800 text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-dark-700 tracking-wide uppercase inline-block">
                  Event Completed / Passed
                </span>
              </div>
            )}
            
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 mb-8 text-sm text-gray-300 bg-dark-800 p-4 rounded-lg border border-dark-700">
              <div className="flex flex-col">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Date</span>
                <span className="font-medium">{!isNaN(new Date(event.event_date).getTime()) ? new Date(event.event_date).toLocaleString() : 'TBA'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Venue</span>
                <span className="font-medium">{event.venue}</span>
              </div>
              {event.max_team_size && (
                <div className="flex flex-col">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Max Team Size</span>
                  <span className="font-medium">{event.max_team_size} members</span>
                </div>
              )}
            </div>
            
            <div className="mb-10">
              <h3 className="text-xl font-bold text-white mb-4">Description</h3>
              <div 
                className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
            
            {(() => {
              const importantDates = (() => {
                try {
                  if (!event.important_dates) return [];
                  if (Array.isArray(event.important_dates)) return event.important_dates;
                  if (typeof event.important_dates === 'string') {
                    return JSON.parse(event.important_dates);
                  }
                  return [];
                } catch {
                  return [];
                }
              })();

              return (
                <section className="mt-8 mb-10">
                  <h2 className="text-lg font-semibold text-amber-400 mb-4">Important Dates</h2>
                  {importantDates.length === 0 ? (
                    <p className="text-gray-500 text-sm">No important dates specified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {importantDates.map((item: { label: string; date: string; title?: string; date_value?: string }, index: number) => (
                        <li key={index} className="flex justify-between text-sm text-gray-300 border-b border-dark-700 pb-2">
                          <span>{item.label || item.title || 'Important Date'}</span>
                          <span className="text-amber-400">{item.date || item.date_value || 'TBA'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })()}

            {event.registration_link && (
              <div className="flex flex-col sm:flex-row items-center justify-between bg-dark-800 p-6 rounded-xl border border-dark-700 mt-8">
                <div className="mb-4 sm:mb-0 text-center sm:text-left">
                  <h4 className="text-lg font-bold text-white mb-1">Ready to participate?</h4>
                  {event.registration_deadline && (
                    <p className="text-sm text-gray-400">
                      Deadline: {new Date(event.registration_deadline).toLocaleString()}
                    </p>
                  )}
                </div>
                <a
                  href={event.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-center w-full sm:w-auto"
                >
                  Register Now
                </a>
              </div>
            )}
          </div>
        </GlowCard>
      </div>
    </div>
  );
};

export default EventDetailView;
