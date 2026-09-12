import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import supabase from '../services/supabaseClient';
import { eventsService } from '../services/eventsService';
import EventCard from '../components/EventCard';
import TagPill from '../components/TagPill';
import LoaderSkeleton from '../components/LoaderSkeleton';
import type { Event } from '../types/payload';
import { useArticleSearch } from '../hooks/useArticleSearch';
import MobileSearchView from '../components/search/MobileSearchView';

const ExplorePage: React.FC = () => {
  // Mobile Search State
  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    sortBy,
    setSortBy,
    results,
    isSearching,
    allTags: mobileAllTags,
    isLoading: isSearchLoading
  } = useArticleSearch();

  // Desktop / Original State
  const [activeTab, setActiveTab] = useState<'upcoming' | 'topics' | 'featured'>('upcoming');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(6);
  const [allTags, setAllTags] = useState<Array<{ name: string; count: number }>>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await eventsService.listAll();
        if (items && items.length > 0) {
          setEvents(items);
        }

        const { data: eventsData } = await supabase
          .from('events')
          .select('tags')
          .eq('status', 'approved')
          .limit(500);

        const tagCounts = new Map<string, number>();
        (eventsData || []).forEach((row: any) => {
          (row.tags || []).forEach((t: string) => {
            if (t) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
          });
        });

        const tagsArr = Array.from(tagCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
        
        setAllTags(tagsArr);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab]);

  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, displayedCount);

  const featuredEvents = events.filter(event => event.status === 'approved'); // we can fetch featured specifically if there is a flag. Since we don't have one in DB, let's just show top 6 recent.
  const topFeatured = featuredEvents.slice(0, 6);

  const filteredEvents = selectedTag
    ? events.filter(event => event.tags && event.tags.includes(selectedTag))
    : events;

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', symbol: '📅' },
    { id: 'topics', label: 'Topics', symbol: '#' },
    { id: 'featured', label: 'Featured', symbol: '★' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="md:hidden">
        <MobileSearchView
          query={query}
          setQuery={setQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchType={searchType}
          setSearchType={setSearchType}
          results={results}
          isSearching={isSearching}
          allTags={mobileAllTags}
          isLoading={isSearchLoading}
        />
      </div>

      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8 bg-dark-900/50 p-1 rounded-xl border border-dark-800 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center space-x-1 flex-nowrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedTag(null);
                  setLoading(true);
                }}
                className={`flex items-center space-x-2 px-4 py-2 min-h-[44px] rounded-lg transition-colors flex-shrink-0 ${activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
              >
                <span className="font-bold">{tab.symbol}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <LoaderSkeleton variant="article" count={3} />
          </div>
        ) : (
          <>
            {activeTab === 'upcoming' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span className="font-bold text-primary-500">📅</span>
                    <span>Upcoming Events</span>
                  </h2>
                </div>

                <div>
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcomingEvents.map((event, index) => (
                      <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </div>

                  {displayedCount < events.length && (
                    <div className="flex justify-center pt-8">
                      <button
                        onClick={() => setDisplayedCount(prev => prev + 6)}
                        className="px-6 py-3 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
                      >
                        Load More Events
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'topics' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span className="font-bold text-primary-500">#</span>
                    <span>Browse by Topic</span>
                  </h2>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Popular Topics</h3>
                  <div className="flex flex-wrap gap-3">
                    {allTags.map(tag => (
                      <TagPill
                        key={tag.name}
                        tag={`${tag.name} (${tag.count})`}
                        isActive={selectedTag === tag.name}
                        onClick={() => setSelectedTag(tag.name)}
                        variant="outline"
                      />
                    ))}
                  </div>
                </div>

                {selectedTag && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Events tagged with "{selectedTag}"
                    </h3>
                    <div className="space-y-6">
                      {filteredEvents.map((event, index) => (
                        <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                          <EventCard event={event} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'featured' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span className="font-bold text-primary-500">★</span>
                    <span>Featured Events</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  {topFeatured.map((event, index) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default ExplorePage;