import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rss, Filter, TrendingUp, Clock, Users, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { eventsService } from '../services/eventsService';
import EventCard from '../components/EventCard';
import LoaderSkeleton from '../components/LoaderSkeleton';
import MobileFeedView from '../components/MobileFeedView';
import { Event } from '../types/payload';

const FeedPage: React.FC = () => {
  const [feedEvents, setFeedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'team_size'>('newest');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { state } = useApp();
  const { state: authState } = useAuth();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      if (Math.random() > 0.8) {
        fetchFeedEvents();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchFeedEvents = async () => {
    setLoading(true);
    if (!authState.user?.id) {
      setFeedEvents([]);
      setLoading(false);
      return;
    }

    try {
      const res = await eventsService.listAll();
      const rows: Event[] = res || [];

      // Sort
      const sorted = [...rows].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
        return (b.max_team_size || 0) - (a.max_team_size || 0);
      });
      setFeedEvents(sorted);
    } catch (e) {
      setFeedEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedEvents();
  }, [authState.user?.id, sortBy]);

  const handleRefresh = () => {
    fetchFeedEvents();
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Rss className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to see your feed</h1>
          <p className="text-gray-400 mb-6">
            Follow topics to create a personalized reading experience.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <MobileFeedView
        events={feedEvents}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Desktop View */}
      <div className="hidden md:block max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">My Feed</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Rss className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500 flex-shrink-0" />
              <span>My Feed</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Latest events from topics you follow
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2 min-h-[44px] bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50 flex-shrink-0 self-start sm:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-400">Sort by:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center space-x-1 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-sm transition-colors ${sortBy === 'newest'
                  ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <Clock className="w-3 h-3" />
                <span>Newest</span>
              </button>
              <button
                onClick={() => setSortBy('team_size')}
                className={`flex items-center space-x-1 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-sm transition-colors ${sortBy === 'team_size'
                  ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Team Size</span>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {loading ? (
          <LoaderSkeleton variant="article" count={3} />
        ) : feedEvents.length > 0 ? (
          <div className="space-y-6">
            {feedEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Rss className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No new events</h2>
            <p className="text-gray-400 mb-6">
              There are no new events yet. Check back later!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;