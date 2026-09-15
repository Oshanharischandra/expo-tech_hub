import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event } from '../types/payload';
import { eventsService } from '../services/eventsService';
import LoadingSpinner from '../components/LoadingSpinner';

const EventDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; passed: boolean } | null>(null);

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
        <Link to="/" className="text-primary-500 hover:text-primary-400 font-medium mb-6 inline-block">
          &larr; Back to Events
        </Link>
        
        <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-lg">
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
            
            <div className="prose prose-invert max-w-none text-gray-300 mb-10">
              <h3 className="text-xl font-bold text-white mb-4">Description</h3>
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
            
            {event.important_dates && event.important_dates.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-6">Important Dates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {event.important_dates.map((dateObj: any, idx: number) => {
                    const dateVal = new Date(dateObj.date_value || dateObj.date);
                    const isValidDate = !isNaN(dateVal.getTime());
                    
                    return (
                      <div key={idx} className="flex flex-col bg-dark-900 p-5 rounded-xl border border-dark-700/50 hover:border-dark-600 transition-colors shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-primary-900 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="text-primary-400 font-bold text-xs mb-2 uppercase tracking-widest">
                          {dateObj.label || dateObj.title || 'Important Date'}
                        </span>
                        <span className="text-gray-200 font-medium text-lg mb-1">
                          {isValidDate ? dateVal.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                        </span>
                        <span className="text-gray-500 text-sm font-medium">
                          {isValidDate ? dateVal.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
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
        </div>
      </div>
    </div>
  );
};

export default EventDetailView;
