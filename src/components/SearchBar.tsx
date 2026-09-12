import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp } from 'lucide-react';
import Fuse from 'fuse.js';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { searchService } from '../services/searchService';
import { eventsService } from '../services/eventsService';
import supabase from '../services/supabaseClient';
import { Event } from '../types/payload';

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Initialize Fuse.js for search
  const fuse = useMemo(() => {
    return new Fuse(events, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'venue', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [events]);

  // Load events for search
  useEffect(() => {
    const loadEvents = async () => {
      if (eventsLoaded) return;

      try {
        const items = await eventsService.listAll();

        if (!items || items.length === 0) {
          setEvents([]);
          setEventsLoaded(true);
          return;
        }

        setEvents(items);
        setEventsLoaded(true);
      } catch (error) {
        console.error('Failed to load events for search:', error);
        setEvents([]);
        setEventsLoaded(true);
      }
    };

    loadEvents();
  }, [eventsLoaded]);

  // Load search data when component mounts
  useEffect(() => {
    const loadSearchData = async () => {
      setRecentSearches(searchService.getRecentSearches());
      const trending = await searchService.getTrendingSearches();
      setTrendingSearches(trending);
    };

    loadSearchData();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim() || !eventsLoaded) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const searchTimeout = setTimeout(() => {
      const results = fuse.search(query);
      setSearchResults(results.map(result => result.item));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, fuse, eventsLoaded]);

  const suggestions = query.trim() ? searchResults.slice(0, 5) : [];

  const { selectedIndex } = useKeyboardNavigation(suggestions, (event) => {
    navigate(`/event/${event.id}`);
    setIsOpen(false);
    setQuery('');
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      searchService.addToHistory(searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setQuery('');
      setRecentSearches(searchService.getRecentSearches());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search events, venues, topics..."
          className="w-full pl-10 pr-4 py-2 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
        />
      </form>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {query.trim() ? (
              <div className="p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Events
                    </div>
                    {suggestions.map((event, index) => (
                      <motion.button
                        key={event.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          navigate(`/event/${event.id}`);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${selectedIndex === index
                          ? 'bg-primary-900/30 text-primary-300'
                          : 'hover:bg-dark-800 text-gray-300'
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {event.venue || 'TBA'}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                    <button
                      onClick={() => handleSearch(query)}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-dark-800 text-primary-400 border-t border-dark-800 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Search for "{query}"</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-8 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{query}"</p>
                    <button
                      onClick={() => handleSearch(query)}
                      className="mt-2 text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Search anyway
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Recent Searches
                </div>
                {recentSearches.length > 0 ? (
                  recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 text-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{search}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No recent searches
                  </div>
                )}
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide mt-4">
                  Trending
                </div>
                {trendingSearches.map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(trend)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 text-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-primary-500" />
                      <span>{trend}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;