import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Event } from '../types/payload';
import { GlowCard } from './ui/spotlight-card';

interface EventCardMobileProps {
    event: Event;
    index?: number;
}

const EventCardMobile: React.FC<EventCardMobileProps> = ({ event, index = 0 }) => {
    // Helper to validate image
    const hasValidCover = event.cover_image && event.cover_image !== '/logo.png';

    // Format event date
    const formattedDate = event.event_date ? new Date(event.event_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'TBA';

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="mb-4"
        >
            <GlowCard customSize glowColor="gold" className="!p-0 overflow-hidden active:scale-[0.99] transition-transform">
            <Link to={`/event/${event.id}`}>
                <div className="flex min-h-0">
                    <div className="flex-1 min-w-0 p-4 space-y-2">
                        {/* Tags */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                            {event.tags && event.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-primary-400 bg-primary-900/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
                            {event.title}
                        </h3>

                        {/* Meta */}
                        <div className="flex flex-col gap-1 text-xs text-gray-400 pt-1">
                            <span className="flex items-center gap-1 font-medium">
                                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider w-10">When:</span> {formattedDate}
                            </span>
                            <span className="flex items-center gap-1 font-medium line-clamp-1">
                                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider w-10">Where:</span> {event.venue || 'TBA'}
                            </span>
                            {event.max_team_size && (
                                <span className="flex items-center gap-1 font-medium">
                                    <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider w-10">Team:</span> Max {event.max_team_size} members
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Image */}
                    {hasValidCover && (
                        <div className="relative w-28 min-w-[7rem] flex-shrink-0 self-stretch">
                            <img
                                src={event.cover_image!}
                                alt={event.title}
                                className="absolute inset-0 w-full h-full object-cover object-center article-card-image-fade-mobile"
                                loading="lazy"
                            />
                        </div>
                    )}
                </div>
            </Link>
            </GlowCard>
        </motion.article>
    );
};

export default EventCardMobile;
