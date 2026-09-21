import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleCardMobile from '../components/ArticleCardMobile';
import { useApp } from '../contexts/AppContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import type { Article } from '../types/payload';
import { GlowCard } from '../components/ui/spotlight-card';
import { fallbackArticles } from '../data/mockArticles';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const mobileLoadMoreRef = React.useRef<HTMLDivElement>(null);

  const [featuredItems, setFeaturedItems] = React.useState<Article[]>([]);

  // Initial load
  useEffect(() => {
    const fetchInitialArticles = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Fetch Featured Articles separately
        const featured = await articlesService.listFeatured();

        // Fetch User Profiles for Featured Authors
        if (featured && featured.length > 0) {
          const featuredAuthorIds = Array.from(new Set(featured.map(i => i.authorId)));
          const { data: featuredProfiles } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,bio,followers_count,articles_count')
            .in('id', featuredAuthorIds);

          const featuredIdToProfile = new Map((featuredProfiles || []).map((p: any) => [p.id, p]));
          const mappedFeatured: Article[] = featured.map(item => {
            const p: any = featuredIdToProfile.get(item.authorId);
            return {
              id: item.id,
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              content: '',
              author: {
                id: item.authorId,
                name: p?.name || 'Anonymous',
                avatar: p?.avatar_url,
                bio: p?.bio || '',
                followersCount: p?.followers_count ?? 0,
                articlesCount: p?.articles_count ?? 0,
              },
              publishedAt: item.publishedAt || new Date().toISOString(),
              readingTime: item.readingTime || 5,
              likes: item.likes,
              views: item.views,
              comments: Array(item.comments).fill({}),
              tags: item.tags,
              featured: true,
              status: 'published',
              coverImage: item.coverImage,
              customAuthor: item.customAuthor,
            };
          });
          setFeaturedItems(mappedFeatured);
        } else {
          setFeaturedItems([]);
        }

        // Fetch Recent Articles
        const items = await articlesService.listAll(1, 10);

        if (!items || items.length === 0) {
          dispatch({ type: 'SET_ARTICLES', payload: [] });
          setHasMore(false);
          return;
        }

        const authorIds = Array.from(new Set(items.map(i => i.authorId)));
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id,name,avatar_url,bio,followers_count,articles_count')
          .in('id', authorIds);

        if (profileError) {
          console.warn('Failed to fetch profiles:', profileError);
        }

        const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
        const mapped: Article[] = items.map(item => {
          const p: any = idToProfile.get(item.authorId);
          return {
            id: item.id,
            title: item.title,
            slug: item.slug,
            excerpt: item.excerpt,
            content: '',
            author: {
              id: item.authorId,
              name: p?.name || 'Anonymous',
              avatar: p?.avatar_url,
              bio: p?.bio || '',
              followersCount: p?.followers_count ?? 0,
              articlesCount: p?.articles_count ?? 0,
            },
            publishedAt: item.publishedAt || new Date().toISOString(),
            readingTime: item.readingTime || 5,
            likes: item.likes,
            views: item.views,
            comments: Array(item.comments).fill({}),
            tags: item.tags,
            featured: item.featured,
            status: 'published',
            coverImage: item.coverImage,
            customAuthor: item.customAuthor,
          };
        });
        dispatch({ type: 'SET_ARTICLES', payload: mapped });
        setHasMore(items.length === 10);
      } catch (error) {
        console.warn('Could not fetch initial articles from Supabase, using mock fallback:', error);
        dispatch({ type: 'SET_ARTICLES', payload: [] });
        setHasMore(false);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchInitialArticles();
  }, [dispatch]);

  // Load more articles
  const loadMoreArticles = React.useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const items = await articlesService.listAll(nextPage, 10);

      if (!items || items.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const authorIds = Array.from(new Set(items.map(i => i.authorId)));
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id,name,avatar_url,bio,followers_count,articles_count')
        .in('id', authorIds);

      if (profileError) {
        console.warn('Failed to fetch profiles:', profileError);
      }

      const idToProfile = new Map((profiles || []).map((p: any) => [p.id, p]));
      const mapped: Article[] = items.map(item => {
        const p: any = idToProfile.get(item.authorId);
        return {
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          content: '',
          author: {
            id: item.authorId,
            name: p?.name || 'Anonymous',
            avatar: p?.avatar_url,
            bio: p?.bio || '',
            followersCount: p?.followers_count ?? 0,
            articlesCount: p?.articles_count ?? 0,
          },
          publishedAt: item.publishedAt || new Date().toISOString(),
          readingTime: item.readingTime || 5,
          likes: item.likes,
          views: item.views,
          comments: Array(item.comments).fill({}),
          tags: item.tags,
          featured: item.featured,
          status: 'published',
          coverImage: item.coverImage,
          customAuthor: item.customAuthor,
        };
      });

      // Filter out duplicates based on ID
      dispatch({
        type: 'SET_ARTICLES',
        payload: [...state.articles, ...mapped].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      });

      setPage(nextPage);
      setHasMore(items.length === 10);
    } catch (error) {
      console.warn('Failed to load more articles, terminating pagination:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, state.articles, dispatch]);

  // Setup intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting) && hasMore && !loadingMore) {
          loadMoreArticles();
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
  }, [hasMore, loadingMore, loadMoreArticles]);

  const baseFeatured = featuredItems.length > 0 
    ? featuredItems 
    : state.articles.filter(a => a.featured);
  const featuredArticles = baseFeatured.length > 0 
    ? baseFeatured 
    : fallbackArticles.filter(a => a.featured);

  const baseRegular = state.articles.filter(
    article => !featuredArticles.some(f => f.id === article.id)
  );
  const regularArticles = baseRegular.length > 0 
    ? baseRegular 
    : fallbackArticles.filter(a => !featuredArticles.some(f => f.id === a.id));

  if (state.loading && page === 1 && state.articles.length === 0 && featuredItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <div className="md:hidden pb-20 bg-dark-950">
        {/* Hero Section */}
        <div className="px-4 pt-6 pb-8 text-center border-b border-dark-800">
          <h1 className="text-2xl font-bold text-white mb-3 leading-tight font-sans">
            Discover Stories That{' '}
            <span className="text-[#ac834e]">
              Inspire
            </span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            Join thousands of readers exploring ideas that matter. From technology to culture,
            find your next great read on Tech HUB.
          </p>
        </div>

        {/* Featured Articles Section */}
        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ac834e]" />
            Featured Articles
          </h2>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 ? (
          <div className="px-4 mt-4">
            {featuredArticles.map((article, index) => (
              <ArticleCardMobile key={article.id} article={article} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <p className="text-gray-400">No featured articles yet. Check back soon!</p>
          </div>
        )}

        {/* Recent Articles Section (Mobile) */}
        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800 mt-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ac834e]" />
            Recent Stories
          </h2>
        </div>

        <div className="px-4 pb-4 mt-4">
          {regularArticles.length > 0 ? (
            regularArticles.map((article, index) => (
              <ArticleCardMobile key={article.id} article={article} index={index} />
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400">No recent articles found.</p>
            </div>
          )}
        </div>

        {/* Mobile Load More Trigger */}
        {(hasMore || loadingMore) && (
          <div ref={mobileLoadMoreRef} className="py-8 flex justify-center">
            {loadingMore ? (
              <div className="w-8 h-8 border-2 border-[#ac834e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="h-8" />
            )}
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#141414] border border-[#ac834e]/30 text-[#ac834e] text-xs font-mono font-semibold uppercase tracking-widest mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#ac834e] animate-pulse" />
                  <span>Executive Conclave & Knowledge Board</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight font-sans">
                  Tech <span className="text-[#ac834e]">HUB</span>
                </h1>
                <p className="text-lg text-white/70 max-w-2xl mx-auto font-light">
                  Architecting next-generation intelligence, deep systems, and verified knowledge with our executive fellowship.
                </p>
              </div>
            </motion.div>

            {/* Golden Cursor-Tracking Glow Border Smoke Test */}
            <section className="mb-12 p-6 rounded-2xl bg-[#0e0e0e] border border-[#ac834e]/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#ac834e] animate-ping" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#ac834e] font-bold">
                  Golden Cursor-Tracking Glow Border Smoke Test
                </h3>
              </div>
              <p className="text-xs text-white/70 mb-5">
                Move your cursor across the cards. Notice the exact <span className="text-[#ac834e] font-semibold">#AC834E</span> gold radial spotlight tracking along the 2px border against the dark background.
              </p>
              <div className="flex flex-wrap gap-4">
                <GlowCard customSize glowColor="gold" className="bg-[#141414] flex-1 min-w-[200px] h-32 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 w-fit">
                    COLOR: #AC834E
                  </span>
                  <p className="text-[#ac834e] text-sm font-bold">Gold glow test</p>
                  <p className="text-[11px] text-white/50">Primary Gold Hue (34)</p>
                </GlowCard>
                <GlowCard customSize glowColor="amber" className="bg-[#141414] flex-1 min-w-[200px] h-32 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 w-fit">
                    COLOR: #AC834E
                  </span>
                  <p className="text-[#ac834e] text-sm font-bold">Amber glow test</p>
                  <p className="text-[11px] text-white/50">Warm Amber Spotlight</p>
                </GlowCard>
                <GlowCard customSize glowColor="champagne" className="bg-[#141414] flex-1 min-w-[200px] h-32 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 w-fit">
                    COLOR: #AC834E
                  </span>
                  <p className="text-white text-sm font-bold">White highlight test</p>
                  <p className="text-[11px] text-white/50">High-Contrast White & Gold</p>
                </GlowCard>
              </div>
            </section>

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Articles</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} featured />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Articles */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">Recent Articles</h2>
              {regularArticles.length > 0 ? (
                <div className="space-y-6">
                  {regularArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No articles found. Be the first to publish!</p>
                </div>
              )}

              {/* Load More Trigger */}
              {(hasMore || loadingMore) && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {loadingMore ? (
                    <div className="w-8 h-8 border-2 border-[#ac834e] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="h-8" />
                  )}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default HomePage;