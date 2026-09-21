import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Sparkles,
  X,
  Trash2,
  CheckCircle2,
  Ticket,
  Plus,
  Minus,
  ShieldCheck,
  ArrowRight,
  Calendar,
  MapPin,
  BookOpen
} from 'lucide-react';
import ArticleCard from '../components/ArticleCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleCardMobile from '../components/ArticleCardMobile';
import { EventDetailView } from './EventDetailView';
import { useApp } from '../contexts/AppContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import type { Article } from '../types/payload';
import { mockEvents } from '../data/mockEvents';
import type { TechEvent } from '../types/event';
import { fallbackArticles } from '../data/mockArticles';
import { GlowCard } from '../components/ui/spotlight-card';

interface CartItem {
  event: TechEvent;
  tier: 'executive' | 'virtual';
  price: number;
  quantity: number;
}

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const mobileLoadMoreRef = React.useRef<HTMLDivElement>(null);

  const [featuredItems, setFeaturedItems] = useState<Article[]>([]);

  // Single featured event (clean & minimalist)
  const featuredEvent = mockEvents[0];
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([
    {
      event: featuredEvent,
      tier: 'executive',
      price: 499,
      quantity: 1,
    }
  ]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

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

  // Cart operations
  const handleAddToCart = (event: TechEvent, tier: 'executive' | 'virtual' = 'executive') => {
    const price = tier === 'executive' ? 499 : 0;
    setCart(prev => {
      const existing = prev.find(i => i.event.id === event.id && i.tier === tier);
      if (existing) {
        return prev.map(i =>
          i.event.id === event.id && i.tier === tier
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { event, tier, price, quantity: 1 }];
    });
    setCheckoutSuccess(false);
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (eventId: string, tier: string) => {
    setCart(prev => prev.filter(i => !(i.event.id === eventId && i.tier === tier)));
  };

  const handleUpdateQuantity = (eventId: string, tier: string, delta: number) => {
    setCart(prev =>
      prev
        .map(i => {
          if (i.event.id === eventId && i.tier === tier) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleCheckout = () => {
    const code = `TH-PASS-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    setConfirmationCode(code);
    setCheckoutSuccess(true);
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  // If viewing detailed single event
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] text-white">
        <EventDetailView
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white relative">
      
      {/* ============================================================ */}
      {/* Glowing Slide-Over Cart Drawer & Reservation System           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#101010] border-l border-[#ac834e]/40 shadow-2xl p-6 flex flex-col justify-between z-10 overflow-y-auto"
            >
              <div>
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#ac834e]/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#ac834e]/15 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg text-white">Conclave Pass Cart</h3>
                      <p className="text-xs text-white/50">{totalCartCount} pass{totalCartCount !== 1 ? 'es' : ''} reserved</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Checkout Confirmation State */}
                {checkoutSuccess ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-[#181818] to-[#121212] border border-[#ac834e]/40 text-center space-y-4 my-4 shadow-gold-glow">
                    <div className="w-14 h-14 rounded-full bg-[#ac834e]/20 border border-[#ac834e] flex items-center justify-center mx-auto text-[#ac834e]">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 inline-block mb-2">
                        Official Delegate Pass
                      </span>
                      <h4 className="text-xl font-serif font-bold text-white">Reservation Confirmed!</h4>
                      <p className="text-xs text-white/70 mt-1">
                        Your pass credentials have been recorded on the Tech HUB registry.
                      </p>
                    </div>

                    <div className="p-4 bg-[#0e0e0e] rounded-xl border border-[#ac834e]/30 font-mono text-left text-xs space-y-2">
                      <div className="flex justify-between text-white/60">
                        <span>CONFIRMATION CODE:</span>
                        <span className="text-[#ac834e] font-bold">{confirmationCode}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>ATTENDEE STATUS:</span>
                        <span className="text-emerald-400 font-semibold">VERIFIED EXECUTIVE</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>TOTAL PAID:</span>
                        <span className="text-white font-bold">${totalCartPrice}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#ac834e] flex items-center justify-center gap-1.5 pt-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cryptographically Signed Pass Issued</span>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutSuccess(false);
                        setCart([]);
                        setIsCartOpen(false);
                      }}
                      className="w-full py-3 rounded-xl bg-[#ac834e] text-[#0e0e0e] font-bold text-sm uppercase tracking-wider hover:bg-[#c49a62] transition-colors shadow-gold-glow-sm"
                    >
                      Done & Return to Conclave
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cart Items List */}
                    {cart.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <Ticket className="w-12 h-12 text-white/20 mx-auto" />
                        <h4 className="text-white font-bold text-base">Your pass cart is empty</h4>
                        <p className="text-xs text-white/50 max-w-xs mx-auto">
                          Select the upcoming conclave below to reserve your in-person or virtual executive access pass.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 mb-6">
                        {cart.map((item) => (
                          <div
                            key={`${item.event.id}-${item.tier}`}
                            className="p-4 rounded-xl bg-[#181818] border border-[#ac834e]/25 flex flex-col gap-3 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
                                  {item.tier === 'executive' ? 'Executive Pass' : 'Virtual Pass'}
                                </span>
                                <h4 className="font-serif font-bold text-sm text-white mt-1 leading-snug line-clamp-2">
                                  {item.event.title}
                                </h4>
                                <p className="text-[11px] text-white/50 mt-0.5">{item.event.date} • {item.event.location.split(',')[0]}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.event.id, item.tier)}
                                className="text-white/40 hover:text-red-400 transition-colors p-1"
                                title="Remove pass"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.event.id, item.tier, -1)}
                                  className="w-7 h-7 rounded-lg bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white/80 transition-colors text-xs"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-sm font-bold w-6 text-center font-mono">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.event.id, item.tier, 1)}
                                  className="w-7 h-7 rounded-lg bg-[#222222] hover:bg-[#333333] flex items-center justify-center text-white/80 transition-colors text-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-base font-bold text-[#ac834e] font-mono">
                                  {item.price === 0 ? 'FREE' : `$${item.price * item.quantity}`}
                                </div>
                                <div className="text-[10px] text-white/40 font-mono">
                                  {item.price === 0 ? 'Virtual Stage' : `$${item.price} each`}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Included VIP Privileges */}
                        <div className="p-4 rounded-xl bg-[#141414] border border-[#ac834e]/20 space-y-2">
                          <h5 className="text-xs font-bold text-[#ac834e] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Executive Benefits Included:</span>
                          </h5>
                          <ul className="text-xs text-white/70 space-y-1 font-light">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e]" />
                              <span>Direct access to keynote speakers & conclave floor</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e]" />
                              <span>Closed-door technical panel & Chatham House discussions</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e]" />
                              <span>Cryptographic Merkle Proof attendance credential</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cart Footer */}
              {!checkoutSuccess && cart.length > 0 && (
                <div className="pt-4 border-t border-[#ac834e]/30 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Pass Subtotal</span>
                      <span className="font-mono text-white font-semibold">${totalCartPrice}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Conclave Accreditation</span>
                      <span className="text-emerald-400 font-mono">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                      <span>Total Investment</span>
                      <span className="text-lg font-mono text-[#ac834e]">${totalCartPrice}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ac834e] to-[#c49a62] text-[#0e0e0e] font-bold text-sm uppercase tracking-wider hover:opacity-95 transition-all shadow-gold-glow-lg flex items-center justify-center gap-2"
                  >
                    <span>Confirm Pass & Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Pass Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#141414] hover:bg-[#1a1a1a] text-white border border-[#ac834e]/70 rounded-2xl shadow-gold-glow-lg transition-all active:scale-95 group"
        >
          <ShoppingCart className="w-4 h-4 text-[#ac834e] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Passes ({totalCartCount})</span>
          <span className="text-xs font-mono font-bold text-[#ac834e] bg-[#ac834e]/15 px-2 py-0.5 rounded-md border border-[#ac834e]/30">
            ${totalCartPrice}
          </span>
        </motion.button>
      )}

      {/* ============================================================ */}
      {/* Mobile View                                                  */}
      {/* ============================================================ */}
      <div className="md:hidden pb-20 bg-[#0e0e0e]">
        {/* Hero Section */}
        <div className="px-4 pt-6 pb-8 text-center border-b border-dark-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#ac834e]/30 text-[#ac834e] text-xs font-mono font-semibold uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ac834e] animate-pulse" />
            <span>Executive Conclave & Knowledge Board</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight font-sans">
            Tech <span className="text-[#ac834e]">HUB</span>
          </h1>
          <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
            Architecting next-generation intelligence, deep systems, and verified knowledge with our executive fellowship.
          </p>
        </div>

        {/* Minimalistic Single Upcoming Event Card on Mobile */}
        <div className="px-4 py-5 border-b border-dark-800">
          <GlowCard
            customSize
            glowColor="gold"
            className="bg-[#121212] border border-[#ac834e]/30 rounded-2xl p-4 flex flex-col gap-3 shadow-gold-glow-sm"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e] animate-pulse" />
                Upcoming Event
              </span>
              <span className="text-[#ac834e] font-mono text-xs font-semibold">
                {featuredEvent.date}
              </span>
            </div>

            <Link to="/article/autonomous-systems-llm-conclave-2026">
              <h3 className="text-lg font-serif font-bold text-white leading-snug hover:text-[#ac834e] transition-colors cursor-pointer">
                {featuredEvent.title}
              </h3>
            </Link>

            <p className="text-xs text-white/70 line-clamp-2 font-light leading-relaxed">
              {featuredEvent.tagline}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#ac834e]/20 text-xs">
              <div className="flex items-center gap-1.5 text-white/60 truncate max-w-[150px]">
                <MapPin className="w-3 h-3 text-[#ac834e] flex-shrink-0" />
                <span className="truncate">{featuredEvent.location.split(',')[0]}</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#ac834e]">$499</div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/article/autonomous-systems-llm-conclave-2026"
                className="flex-1 py-2.5 text-xs font-semibold text-white/80 hover:text-white bg-[#1a1a1a] hover:bg-[#222222] border border-[#ac834e]/30 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#ac834e]" />
                <span>More Details</span>
              </Link>
              <Link
                to="/event/ai-conclave-2026/register"
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0e0e0e] bg-[#ac834e] hover:bg-[#c49a62] rounded-xl text-center flex items-center justify-center gap-1.5 shadow-gold-glow-sm active:scale-95 transition-all"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </GlowCard>
        </div>

        {/* Featured Articles Section */}
        <div className="sticky top-16 z-30 bg-dark-950 px-4 py-3 border-b border-dark-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ac834e]" />
            Featured Articles
          </h2>
        </div>

        {/* Featured Articles List */}
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

      {/* ============================================================ */}
      {/* Desktop View                                                 */}
      {/* ============================================================ */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
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

            {/* ============================================================ */}
            {/* MINIMALISTIC SINGLE UPCOMING EVENT WITH GOLD GLOW            */}
            {/* ============================================================ */}
            <section className="mb-12">
              <GlowCard
                customSize
                glowColor="gold"
                className="bg-[#121212]/95 border border-[#ac834e]/30 rounded-2xl p-6 sm:p-7 relative overflow-hidden transition-all duration-300 hover:shadow-gold-glow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Event Details */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ac834e]/15 text-[#ac834e] border border-[#ac834e]/30 font-semibold uppercase tracking-wider text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ac834e] animate-pulse" />
                        Upcoming Conclave
                      </span>
                      <span className="text-white/70 font-mono text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#ac834e]" />
                        {featuredEvent.date}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/70 text-xs flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#ac834e]" />
                        {featuredEvent.location.split(',')[0]}
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="text-[#ac834e] text-xs font-medium">
                        {featuredEvent.format}
                      </span>
                    </div>

                    <Link to="/article/autonomous-systems-llm-conclave-2026" className="block group/title">
                      <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white group-hover/title:text-[#ac834e] transition-colors cursor-pointer tracking-tight">
                        {featuredEvent.title}
                      </h3>
                    </Link>

                    <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-2xl">
                      {featuredEvent.tagline}
                    </p>

                    {/* Keynote Speakers & Capacity */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                          {featuredEvent.speakers.map((spk, idx) => (
                            <img
                              key={idx}
                              src={spk.avatar}
                              alt={spk.name}
                              className="w-6 h-6 rounded-full border border-[#ac834e]/50 object-cover"
                            />
                          ))}
                        </div>
                        <span className="truncate">
                          Keynotes: <strong className="text-white font-medium">{featuredEvent.speakers[0].name}</strong> ({featuredEvent.speakers[0].role})
                        </span>
                      </div>
                      <span className="text-[#ac834e] font-mono text-xs">
                        • {featuredEvent.attendeesCount}/{featuredEvent.maxCapacity} seats reserved
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Pricing & Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 lg:border-l border-[#ac834e]/20 pt-4 lg:pt-0 lg:pl-8 flex-shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Executive Pass</div>
                      <div className="text-2xl font-bold font-mono text-[#ac834e]">$499</div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Link
                        to="/article/autonomous-systems-llm-conclave-2026"
                        className="px-4 py-2.5 text-xs font-semibold text-white/80 hover:text-white bg-[#1a1a1a] hover:bg-[#222222] border border-[#ac834e]/30 hover:border-[#ac834e]/60 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#ac834e]" />
                        <span>More Details</span>
                      </Link>
                      <Link
                        to="/event/ai-conclave-2026/register"
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0e0e0e] bg-[#ac834e] hover:bg-[#c49a62] rounded-xl shadow-gold-glow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Register</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </section>

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ac834e]" />
                  <span>Featured Articles</span>
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} featured />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Articles */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ac834e]" />
                <span>Recent Articles</span>
              </h2>
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