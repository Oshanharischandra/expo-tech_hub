import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Event } from '../types/payload';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
  // Helper to validate image
  const hasValidCover = event.cover_image && event.cover_image !== '/logo.png';

  // Format event date
  const formattedDate = event.event_date ? new Date(event.event_date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'TBA';

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-xl bg-dark-900/50 border border-dark-800 hover:border-primary-500/50 transition-all duration-300"
      >
        <div className={`${hasValidCover ? 'aspect-w-16 aspect-h-9' : 'min-h-[200px] flex flex-col justify-end'} relative`}>
          <Link to={`/event/${event.id}`}>
            {hasValidCover ? (
              <img
                src={event.cover_image!}
                alt={event.title}
                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-primary-900/40 to-dark-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
          </Link>
          <div className={`${hasValidCover ? 'absolute bottom-0 left-0 right-0' : 'relative'} p-6 pointer-events-none`}>
            <div className="flex items-center gap-2 overflow-x-auto pb-3 hide-scrollbar pointer-events-auto">
              {event.tags && event.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-primary-400 bg-primary-900/20 border border-primary-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
            
            <Link to={`/event/${event.id}`} className="pointer-events-auto block">
              <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                {event.title}
              </h2>
            </Link>

            <div className="flex flex-col gap-2 mt-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-16">Date</span>
                <span className="text-sm font-medium text-gray-300">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-16">Venue</span>
                <span className="text-sm font-medium text-gray-300 line-clamp-1">{event.venue || 'TBA'}</span>
              </div>
              {event.max_team_size && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-16">Team</span>
                  <span className="text-sm font-medium text-gray-300">Max {event.max_team_size} members</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 pointer-events-auto">
              <Link to={`/event/${event.id}`} className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto">
                View Details
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden bg-dark-900/50 border border-dark-800 rounded-xl hover:border-primary-500/50 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row min-h-0">
        <div className="order-2 sm:order-1 flex-1 min-w-0 p-4 sm:p-6 flex flex-col">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 hide-scrollbar">
            {event.tags && event.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-primary-400 bg-primary-900/20 border border-primary-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>

          <Link to={`/event/${event.id}`} className="block flex-1">
            <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 group-hover:text-primary-400 transition-colors">
              {event.title}
            </h3>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-14">Date</span>
                <span className="text-sm font-medium text-gray-300">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-14">Venue</span>
                <span className="text-sm font-medium text-gray-300 line-clamp-1">{event.venue || 'TBA'}</span>
              </div>
              {event.max_team_size && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 w-14">Team</span>
                  <span className="text-sm font-medium text-gray-300">Max {event.max_team_size} members</span>
                </div>
              )}
            </div>
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <Link to={`/event/${event.id}`} className="text-sm font-bold text-primary-400 hover:text-primary-300 transition-colors">
              View Details →
            </Link>
          </div>
        </div>

        {hasValidCover && (
          <Link
            to={`/event/${event.id}`}
            className="order-1 sm:order-2 relative w-full aspect-video sm:aspect-auto sm:w-56 sm:min-w-[224px] sm:min-h-full sm:self-stretch block overflow-hidden bg-dark-800"
          >
            <img
              src={event.cover_image!}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 article-card-image-fade"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent sm:hidden"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;