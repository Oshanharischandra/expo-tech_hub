import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { eventsService } from '../services/eventsService';
import { Event } from '../types/payload';

export type SearchType = 'events' | 'tags';

export interface Tag {
    name: string;
    count: number;
}

export const useArticleSearch = () => {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('events');
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'team_size'>('relevance');

    // Data
    const [events, setEvents] = useState<Event[]>([]);

    // Internal search state
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchResultsType, setSearchResultsType] = useState<SearchType>('events');

    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const tags = useMemo(() => {
        const tagCounts = new Map<string, number>();
        events.forEach(event => {
            event.tags?.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });
        return Array.from(tagCounts.entries())
            .map(([name, count]) => ({ name, count } as Tag))
            .sort((a, b) => b.count - a.count);
    }, [events]);

    // Fuse Instances
    const fuseEvents = useMemo(() => new Fuse(events, {
        keys: [
            { name: 'title', weight: 0.4 },
            { name: 'description', weight: 0.3 },
            { name: 'tags', weight: 0.2 },
            { name: 'venue', weight: 0.1 }
        ],
        threshold: 0.4,
        includeScore: true
    }), [events]);

    const fuseTags = useMemo(() => new Fuse(tags, {
        keys: ['name'],
        threshold: 0.3
    }), [tags]);

    // Initial Load
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const items = await eventsService.listAll();
                if (!items || items.length === 0) {
                    setEvents([]);
                    return;
                }
                setEvents(items);
            } catch (error) {
                console.error('Failed to load events:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadEvents();
    }, []);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Perform Search
    useEffect(() => {
        if (isLoading) return;

        if (!query.trim() && selectedTags.length === 0) {
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeout = setTimeout(() => {
            let res: any[] = [];
            if (searchType === 'events') {
                let baseEvents = query.trim()
                    ? fuseEvents.search(query).map(r => r.item)
                    : events;

                if (selectedTags.length > 0) {
                    baseEvents = baseEvents.filter(event =>
                        selectedTags.every(tag => event.tags?.includes(tag))
                    );
                }
                res = baseEvents;
            } else if (searchType === 'tags') {
                res = fuseTags.search(query).map(r => r.item);
            }
            setSearchResults(res);
            setSearchResultsType(searchType);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query, searchType, events, tags, fuseEvents, fuseTags, isLoading, selectedTags]);

    // Compute Final Results
    const results = useMemo(() => {
        if (!query.trim() && selectedTags.length === 0) {
            switch (searchType) {
                case 'tags': return tags;
                case 'events': default: return events;
            }
        }

        if (searchResultsType !== searchType) {
            return [];
        }

        return searchResults;
    }, [query, searchType, events, tags, searchResults, searchResultsType, selectedTags]);

    // Sort Results
    const sortedResults = useMemo(() => {
        if (searchType !== 'events') return results;

        return [...results].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
                case 'team_size':
                    return (b.max_team_size || 0) - (a.max_team_size || 0);
                default:
                    if (query.trim()) return 0;
                    return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
            }
        });
    }, [results, sortBy, searchType, query]);

    return {
        query,
        setQuery,
        searchType,
        setSearchType,
        sortBy,
        setSortBy,
        results: sortedResults,
        isSearching: isSearching || ((!!query.trim() || selectedTags.length > 0) && searchResultsType !== searchType),
        isLoading,
        allTags: tags,
        selectedTags,
        setSelectedTags
    };
};
