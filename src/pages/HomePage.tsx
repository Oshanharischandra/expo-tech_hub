import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import EventCard from '../components/EventCard';
import EventCardMobile from '../components/EventCardMobile';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { eventsService } from '../services/eventsService';
import type { Event } from '../types/payload';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const mobileLoadMoreRef = React.useRef<HTMLDivElement>(null);

  const [featuredItems, setFeaturedItems] = React.useState<Event[]>([]);
  const [regularItems, setRegularItems] = React.useState<Event[]>([]);

  // Initial load
  useEffect(() => {
    const fetchInitialEvents = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const featured = await eventsService.listFeatured();
        setFeaturedItems(featured);

        const items = await eventsService.listAll(1, 10);
        setRegularItems(items);
        setHasMore(items.length === 10);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: 'Failed to load events' } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchInitialEvents();
  }, [dispatch]);

  // Load more events
  const loadMoreEvents = React.useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const items = await eventsService.listAll(nextPage, 10);

      if (!items || items.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      setRegularItems(prev => [...prev, ...items].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
      setPage(nextPage);
      setHasMore(items.length === 10);
    } catch (error) {
      console.error('Failed to load more events:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore]);

  // Setup intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting) && hasMore && !loadingMore) {
          loadMoreEvents();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    if (mobileLoadMoreRef.current) observer.observe(mobileLoadMoreRef.current);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadMoreEvents]);

  const featuredEvents = featuredItems;
  const regularEvents = regularItems.filter(
    event => !featuredEvents.some(f => f.id === event.id)
  );

  if (state.loading && page === 1) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <div className="md:hidden pb-20 bg-dark-950">
        <div className="px-4 pt-6 pb-8 text-center border-b border-dark-800">
          <h1 className="text-2xl font-bold text-white mb-3 leading-tight">
            Tech Hub{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
              Event Board
            </span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            Discover and participate in upcoming tech events, hackathons, and workshops.
          </p>
        </div>

        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="font-bold text-primary-500">★</span> Featured Events
          </h2>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="px-4 mt-4">
            {featuredEvents.map((event, index) => (
              <EventCardMobile key={event.id} event={event} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-400">No featured events yet. Check back soon!</p>
          </div>
        )}

        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800 mt-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="font-bold text-primary-500">#</span> Upcoming Events
          </h2>
        </div>

        <div className="px-4 pb-4 mt-4">
          {regularEvents.length > 0 ? (
            regularEvents.map((event, index) => (
              <EventCardMobile key={event.id} event={event} index={index} />
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400">No upcoming events found.</p>
            </div>
          )}
        </div>

        {(hasMore || loadingMore) && (
          <div ref={mobileLoadMoreRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="h-8" />
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Tech Hub{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                    Event Board
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Discover and participate in upcoming tech events, hackathons, and workshops.
                </p>
              </div>
            </motion.div>

            {featuredEvents.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Events</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredEvents.map((event) => (
                    <EventCard key={event.id} event={event} featured />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Upcoming Events</h2>
              {regularEvents.length > 0 ? (
                <div className="space-y-6">
                  {regularEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No events found. Be the first to publish!</p>
                </div>
              )}

              {(hasMore || loadingMore) && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {loadingMore ? (
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="h-8" />
                  )}
                </div>
              )}
            </section>
          </main>

          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default HomePage;