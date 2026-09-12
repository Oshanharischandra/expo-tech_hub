import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc } from 'lucide-react';
import { useArticleSearch } from '../hooks/useArticleSearch';
import MobileSearchView from '../components/search/MobileSearchView';
import LoaderSkeleton from '../components/LoaderSkeleton';
import TagPill from '../components/TagPill';
import EventCard from '../components/EventCard';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    sortBy,
    setSortBy,
    selectedTags,
    setSelectedTags,
    results,
    isSearching,
    allTags,
    isLoading
  } = useArticleSearch();

  // Sync URL with query
  React.useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [query]);

  // Mobile View
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
          allTags={allTags}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span>Search</span>
          {query && (
            <>
              <span>/</span>
              <span className="text-white">"{query}"</span>
            </>
          )}
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          {/* Search Type Toggles */}
          <div className="flex gap-4 mt-4 border-b border-dark-800 pb-1">
            {(['events', 'tags'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type as any)}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${searchType === type ? 'text-primary-500' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {searchType === type && (
                  <motion.div layoutId="searchTypeUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                )}
              </button>
            ))}
          </div>
          {!isSearching && !isLoading && (
            <p className="text-gray-400 mt-4">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {searchType === 'events' && (
            <aside className="lg:w-64 space-y-6">
              <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <SortAsc className="w-5 h-5" />
                  <span>Sort by</span>
                </h3>
                <div className="space-y-2">
                  {[
                    { value: 'relevance', label: 'Relevance' },
                    { value: 'date', label: 'Event Date' },
                    { value: 'team_size', label: 'Team Size' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${sortBy === option.value
                        ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                        : 'text-gray-300 hover:bg-dark-800'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-dark-900/50 border border-dark-800 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filter by topics</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 15).map(tag => (
                    <TagPill
                      key={tag.name}
                      tag={tag.name}
                      isActive={selectedTags.includes(tag.name)}
                      onClick={() => setSelectedTags(
                        selectedTags.includes(tag.name)
                          ? selectedTags.filter(t => t !== tag.name)
                          : [...selectedTags, tag.name]
                      )}
                      variant="outline"
                      size="sm"
                    />
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </aside>
          )}

          <main className="flex-1">
            {isLoading || isSearching ? (
              <LoaderSkeleton variant={'article'} count={3} />
            ) : results.length > 0 ? (
              <div className={"space-y-6"}>
                {searchType === 'events' && results.map((event: any, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}

                {searchType === 'tags' && (
                  <div className="flex flex-wrap gap-2">
                    {results.map((tag: any) => (
                      <TagPill
                        key={tag.name}
                        tag={`${tag.name} (${tag.count})`}
                        variant="outline"
                        onClick={() => {
                          setQuery(tag.name);
                          setSearchType('events');
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : query ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No results found</h2>
                <p className="text-gray-400 mb-6">
                  We couldn't find any {searchType} matching "{query}". Try adjusting your search terms or filters.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Check your spelling</p>
                  <p>• Try different keywords</p>
                  <p>• Remove filters to see more results</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Start searching</h2>
                <p className="text-gray-400">
                  Enter a search term to find events and topics.
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
export default SearchPage;