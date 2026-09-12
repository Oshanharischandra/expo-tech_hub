import React from 'react';
import { Event } from '../types/payload';
import EventCardMobile from './EventCardMobile';

interface MobileFeedViewProps {
    events: Event[];
    loading: boolean;
    onRefresh: () => void;
}

const MobileFeedView: React.FC<MobileFeedViewProps> = ({ events, loading, onRefresh }) => {
    return (
        <div className="md:hidden min-h-screen bg-dark-950 pb-20">
            {/* Event List */}
            <div className="bg-dark-950 px-4 pt-4">
                {loading ? (
                    <div className="text-center text-gray-400 py-10">Loading events...</div>
                ) : events.length > 0 ? (
                    events.map((event, index) => (
                        <EventCardMobile key={event.id} event={event} index={index} />
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-10 px-4">
                        No events found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileFeedView;
