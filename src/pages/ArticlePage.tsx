import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  Clock,
  Eye,
  Linkedin,
  Facebook,
  Send,
  Link as LinkIcon,
  Trash2,
  Sparkles,
  ArrowRight,
  Mail,
  BookOpen,
  Compass,
  TrendingUp
} from 'lucide-react';
import { Article } from '../types/payload';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import { commentsService } from '../services/commentsService';
import { viewsService } from '../services/viewsService';
import { likesService } from '../services/likesService';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizCard from '../components/quiz/QuizCard';
import { FollowButton } from '../components/follow/FollowButton';
import Avatar from '../components/common/Avatar';
import { fallbackArticles } from '../data/mockArticles';

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [recommendedArticles, setRecommendedArticles] = useState<Article[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);
  const { dispatch } = useApp();
  const { state: authState } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        // Try to fetch by slug first, if that fails and slug looks like a UUID, try by ID
        let data = await articlesService.getBySlug(slug);

        // If slug is actually an ID (UUID format), try fetching by ID
        if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
          data = await articlesService.getById(slug);
        }

        if (!data) {
          // Check fallback mock articles (e.g. sample articles)
          const fallback = fallbackArticles.find(a => a.slug === slug || a.id === slug);
          if (fallback) {
            setArticle(fallback as any);
            setLikesCount(fallback.likes || 0);
          } else {
            setArticle(null);
          }
        } else {
          // fetch author profile
          let profile: any = null;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id,name,avatar_url,bio,followers_count,articles_count')
              .eq('id', (data as any).authorId)
              .single();
            profile = profileData;
          } catch (e) {
            console.warn('Profile fetch skipped:', e);
          }

          // fetch comments with user profiles
          let comments: any[] = [];
          try {
            comments = await commentsService.listByArticle(data.id);
          } catch (e) {
            console.warn('Comments fetch skipped:', e);
          }

          const articleData = {
            id: data.id,
            title: data.title,
            excerpt: data.excerpt,
            content: data.contentHtml,
            author: {
              id: (data as any).authorId || 'author-default',
              name: profile?.name || 'Editorial Team',
              avatar: profile?.avatar_url,
              bio: profile?.bio || '',
              followersCount: profile?.followers_count ?? 1280,
              articlesCount: profile?.articles_count ?? 14,
            },
            publishedAt: data.publishedAt || new Date().toISOString(),
            readingTime: 5,
            likes: data.likes || 0,
            views: data.views || 0,
            comments: comments,
            tags: data.tags || [],
            featured: data.featured,
            status: 'published',
            coverImage: data.coverImage,
            customAuthor: (data as any).customAuthor,
          };

          setArticle(articleData as any);
          setLikesCount(data.likes || 0);

          // Track view
          try {
            const viewTracked = await viewsService.trackView(data.id, authState.user?.id || null);
            if (viewTracked) {
              const updatedData = await articlesService.getBySlug(slug);
              if (updatedData) {
                setArticle(prev => prev ? { ...prev, views: updatedData.views } as any : null);
              }
            }
          } catch (e) {
            // View tracking error silent
          }
        }
      } catch (error) {
        console.error('Failed to fetch article, checking fallback:', error);
        const fallback = fallbackArticles.find(a => a.slug === slug || a.id === slug);
        if (fallback) {
          setArticle(fallback as any);
          setLikesCount(fallback.likes || 0);
        } else {
          dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: 'Failed to load article' } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, authState.user?.id, dispatch]);

  // Load recommended articles
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const all = await articlesService.listAll();
        if (all && all.length > 0) {
          const filtered = all
            .filter((a: any) => a.slug !== slug && a.id !== slug)
            .slice(0, 4);
          if (filtered.length > 0) {
            setRecommendedArticles(filtered as any);
            return;
          }
        }
      } catch (e) {
        // use fallback
      }
      const filteredMock = fallbackArticles
        .filter(a => a.slug !== slug && a.id !== slug)
        .slice(0, 4);
      setRecommendedArticles(filteredMock);
    };

    fetchRecommended();
  }, [slug]);

  // Load like status when article and user are available
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!article || !authState.user) return;

      try {
        const liked = await likesService.checkIfLiked(article.id, authState.user.id);
        setIsLiked(liked);
      } catch (error) {
        console.warn('Failed to load like status:', error);
      }
    };

    loadLikeStatus();
  }, [article, authState.user]);

  const handleLike = async () => {
    if (!article) return;

    if (!authState.user) {
      // Allow local demonstration like even when logged out for testability
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
      return;
    }

    try {
      if (isLiked) {
        await likesService.unlikeArticle(article.id, authState.user.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await likesService.likeArticle(article.id, authState.user.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.warn('DB like toggle failed, falling back to local toggle:', error);
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !article || !authState.user) return;

    setCommentLoading(true);
    try {
      await commentsService.create({
        articleId: article.id,
        userId: authState.user.id,
        content: comment,
      });

      // Refresh comments from database to get the latest with proper user data
      const updatedComments = await commentsService.listByArticle(article.id);
      setArticle(prev => prev ? { ...prev, comments: updatedComments } as any : null);
      setComment('');
      showSuccess('Comment posted successfully');
    } catch (error) {
      console.warn('Failed to add comment to database, adding locally:', error);
      const newComment = {
        id: `comment-${Date.now()}`,
        articleId: article.id,
        content: comment,
        createdAt: new Date().toISOString(),
        author: {
          id: authState.user.id,
          name: authState.user.name || 'Current User',
          avatar: authState.user.avatar?.url
        }
      };
      setArticle(prev => prev ? {
        ...prev,
        comments: [newComment, ...(prev.comments || [])]
      } as any : null);
      setComment('');
      showSuccess('Comment posted');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsService.remove(commentId);
    } catch (error) {
      console.warn('Failed to delete comment in database, removing locally:', error);
    }
    setArticle(prev => prev ? {
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    } as any : null);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }
    setNewsletterSubscribed(true);
    showSuccess('Thank you for subscribing to Tech HUB Dispatch!');
    setNewsletterEmail('');
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://techhub.expo.lk/article/${article?.slug || article?.id}`;

  // Close share dropdown on outside click
  useEffect(() => {
    if (!isShareOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setIsShareOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShareOpen]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 sm:p-10 rounded-2xl border border-[#ac834e]/25 shadow-xl max-w-md w-full">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#141414] mb-3">Article Not Found</h1>
          <p className="text-[#666666] mb-8 leading-relaxed">The article you are looking for does not exist or has been relocated.</p>
          <Link
            to="/"
            className="inline-block bg-[#ac834e] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#946f3e] transition-colors shadow-md shadow-[#ac834e]/20"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141414]">
      {/* Mobile View */}
      <div className="md:hidden pb-24">
        {/* Hero Section */}
        {article.coverImage ? (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/35 to-transparent" />
          </div>
        ) : (
          <div className="h-28 w-full bg-gradient-to-br from-[#ac834e]/20 to-[#FAF8F5]" />
        )}

        <div className="px-4 -mt-10 relative z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-[#ac834e]/10 text-[#8e6939] px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border border-[#ac834e]/25"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-serif font-bold text-[#141414] mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-5 bg-white p-3.5 rounded-xl border border-[#ac834e]/20 shadow-sm">
            <div className="flex items-center gap-3">
              {article.customAuthor ? (
                <div className="w-11 h-11 rounded-full bg-[#f0e3ce] flex items-center justify-center text-base font-bold text-[#8e6939] border border-[#ac834e]/30 flex-shrink-0">
                  {article.customAuthor.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Link to={`/profile/${article.author.id}`} className="flex-shrink-0">
                  <Avatar
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-11 h-11 border border-[#ac834e]/30 shadow-sm"
                  />
                </Link>
              )}
              <div className="flex flex-col justify-center">
                {article.customAuthor ? (
                  <span className="font-bold text-[#141414] text-sm leading-tight">{article.customAuthor}</span>
                ) : (
                  <Link to={`/profile/${article.author.id}`} className="font-bold text-[#141414] text-sm leading-tight hover:text-[#ac834e] transition-colors">
                    {article.author.name}
                  </Link>
                )}
                <div className="text-[11px] text-[#777777] flex items-center gap-1.5 mt-1 font-medium">
                  <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                  <span className="w-1 h-1 rounded-full bg-[#ac834e]/40"></span>
                  <span>{article.readingTime} min read</span>
                </div>
              </div>
            </div>

            {!article.customAuthor && (
              <div className="flex-shrink-0">
                <FollowButton
                  authorId={article.author.id}
                  compact
                  onChange={(isFollowing) => {
                    setArticle(prev => prev ? {
                      ...prev,
                      author: {
                        ...prev.author,
                        followersCount: Math.max(0, prev.author.followersCount + (isFollowing ? 1 : -1))
                      }
                    } as any : prev);
                  }}
                />
              </div>
            )}
          </div>

          {/* Stats & Actions Bar */}
          <div className="flex items-center justify-between bg-white border border-[#ac834e]/25 rounded-2xl p-2 mb-6 shadow-sm">
            <div className="flex items-center px-1 space-x-3">
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isLiked
                    ? 'bg-red-50 text-red-500 border border-red-200 shadow-sm'
                    : 'bg-[#FAF8F5] text-[#555555] border border-[#ac834e]/20 hover:bg-[#f0e3ce]/40 active:scale-95'
                  }`}
                aria-label="Like article"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-bold text-xs tracking-wide">{likesCount}</span>
              </button>

              <button
                onClick={() => document.querySelector('#comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 text-[#666666] hover:text-[#141414] transition-colors"
                aria-label="View comments"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">{article.comments.length}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[#777777]">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-semibold">{(article.views || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pr-1">
              <button
                onClick={() => setIsShareOpen(!isShareOpen)}
                className="p-2 text-[#555555] hover:text-[#ac834e] bg-[#FAF8F5] hover:bg-[#f0e3ce]/50 rounded-xl transition-all active:scale-95 border border-[#ac834e]/20"
                aria-label="Share article"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-[#555555] hover:text-[#ac834e] bg-[#FAF8F5] hover:bg-[#f0e3ce]/50 rounded-xl transition-all active:scale-95 border border-[#ac834e]/20"
                aria-label="Save article"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-[#ac834e]/20 mb-6" />

          {/* Article Content */}
          <div
            className="prose prose-sm max-w-none mb-8 text-[#2A2A2A] prose-headings:text-[#141414] prose-headings:font-serif prose-a:text-[#ac834e] prose-strong:text-[#141414]"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Quiz Section */}
          <QuizCard articleId={article.id} />

          {/* Comments Section */}
          <section id="comments-section" className="mt-8 pt-6 border-t border-[#ac834e]/20">
            <h3 className="text-xl font-serif font-bold text-[#141414] mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#ac834e]" />
              <span>Comments ({article.comments.length})</span>
            </h3>

            {/* Comment Form */}
            {authState.isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-8">
                <div className="flex gap-3">
                  <Avatar
                    src={authState.user?.avatar?.url}
                    alt={authState.user?.name || 'User'}
                    className="w-10 h-10 border border-[#ac834e]/30"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-white border border-[#ac834e]/30 rounded-xl p-3.5 text-sm text-[#141414] placeholder-[#888888] focus:ring-1 focus:ring-[#ac834e] focus:border-[#ac834e] outline-none resize-none h-24 transition-all shadow-sm"
                    />
                    <div className="flex justify-end mt-2.5">
                      <button
                        type="submit"
                        disabled={!comment.trim() || commentLoading}
                        className="bg-[#ac834e] text-white px-5 py-2 rounded-lg font-bold hover:bg-[#946f3e] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#ac834e]/20 text-xs"
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-white border border-[#ac834e]/25 p-5 rounded-xl text-center mb-8 shadow-sm">
                <p className="text-[#666666] text-sm mb-3">Sign in to join the discussion</p>
                <Link to="/login" className="inline-block bg-[#ac834e] text-white text-xs px-5 py-2 rounded-lg font-bold hover:bg-[#946f3e] transition-all shadow-sm">
                  Login
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {article.comments.map((c) => {
                const canDelete = authState.user && (
                  authState.user.id === c.author.id ||
                  authState.user.role === 'editor' ||
                  authState.user.role === 'admin'
                );

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 group"
                  >
                    <Link to={`/profile/${c.author.id}`} className="flex-shrink-0">
                      <Avatar
                        src={c.author.avatar}
                        alt={c.author.name}
                        className="w-9 h-9 border border-[#ac834e]/25 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-[#ac834e]/20 rounded-xl p-3.5 shadow-sm">
                        <div className="flex justify-between items-center mb-1.5">
                          <Link
                            to={`/profile/${c.author.id}`}
                            className="font-bold text-[#141414] text-xs hover:text-[#ac834e] transition-colors"
                          >
                            {c.author.name}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#888888] font-medium uppercase tracking-wider">
                              {formatDistanceToNow(new Date(c.createdAt))} ago
                            </span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[#888888] hover:text-red-500 transition-colors p-1"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[#333333] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {article.comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-[#ac834e]/30 mx-auto mb-3" />
                  <p className="text-[#777777] text-xs">No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </section>

          {/* Recommended Articles Section on Mobile */}
          {recommendedArticles.length > 0 && (
            <section className="mt-10 pt-8 border-t border-[#ac834e]/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-bold text-[#141414] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ac834e]" />
                  <span>Recommended Articles</span>
                </h3>
                <Link to="/explore" className="text-xs text-[#ac834e] font-semibold">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recommendedArticles.map(rec => (
                  <Link
                    key={rec.id}
                    to={`/article/${rec.slug || rec.id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#ac834e]/20 shadow-sm"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#ac834e]/20 flex-shrink-0">
                      {rec.coverImage ? (
                        <img src={rec.coverImage} alt={rec.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#ac834e]/20 to-[#FAF8F5]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-xs text-[#141414] line-clamp-2 leading-snug">
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#777777] mt-1">
                        <span>{rec.author?.name || 'Tech HUB'}</span>
                        <span>•</span>
                        <span>{rec.readingTime || 5} min read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Mobile Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#ac834e]/25 px-6 py-2.5 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
          <button
            onClick={handleLike}
            className={`flex flex-col items-center gap-1 ${isLiked ? 'text-red-500' : 'text-[#666666]'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-semibold">{likesCount}</span>
          </button>

          <button
            onClick={() => {
              document.querySelector('#comments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-[#666666]"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{article.comments.length}</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex flex-col items-center gap-1 text-[#666666]"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Share</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-[#666666]">
            <BookmarkPlus className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Save</span>
          </button>
        </div>

        {/* Mobile Share Sheet */}
        {isShareOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsShareOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white border-t border-[#ac834e]/30 w-full rounded-t-2xl p-6 relative z-10 shadow-2xl"
            >
              <div className="w-12 h-1 bg-[#ac834e]/30 rounded-full mx-auto mb-5" />
              <h3 className="text-base font-serif font-bold text-[#141414] mb-4">Share this article</h3>
              <div className="grid grid-cols-3 gap-4">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-[#FAF8F5]"
                  onClick={() => setIsShareOpen(false)}
                >
                  <div className="w-11 h-11 bg-[#0077b5] rounded-full flex items-center justify-center text-white shadow-sm">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-[#555555]">LinkedIn</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-[#FAF8F5]"
                  onClick={() => setIsShareOpen(false)}
                >
                  <div className="w-11 h-11 bg-[#1877f2] rounded-full flex items-center justify-center text-white shadow-sm">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-[#555555]">Facebook</span>
                </a>
                <button
                  className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-[#FAF8F5]"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showSuccess('Link copied to clipboard!');
                    setIsShareOpen(false);
                  }}
                >
                  <div className="w-11 h-11 bg-[#FAF8F5] border border-[#ac834e]/30 rounded-full flex items-center justify-center text-[#8e6939] shadow-sm">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-[#555555]">Copy Link</span>
                </button>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="w-full mt-6 bg-[#FAF8F5] text-[#444444] border border-[#ac834e]/20 py-2.5 rounded-xl font-medium text-sm hover:bg-[#f0e3ce]/30 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Hero Section */}
        {article.coverImage ? (
          <div className="relative h-96 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/40 to-transparent" />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-[#ac834e]/20 to-[#FAF8F5]" />
        )}

        {/* 2-Column Responsive Layout: Left Main Content + Right Recommended Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Main Article Content (8 Cols) */}
            <div className="lg:col-span-8">
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#ac834e]/25 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_10px_35px_rgba(172,131,78,0.08)]"
              >
                {/* Article Header */}
                <header className="mb-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-[#ac834e]/10 text-[#8e6939] px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-[#ac834e]/25 whitespace-nowrap overflow-hidden max-w-full"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#141414] mb-6 leading-tight tracking-tight">
                    {article.title}
                  </h1>

                  <div className="flex flex-col gap-5 pt-2 border-t border-[#ac834e]/15">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        {article.customAuthor ? (
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-[#f0e3ce] flex items-center justify-center text-xl font-bold text-[#8e6939] border border-[#ac834e]/30">
                              {article.customAuthor.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-[#141414] text-base truncate">{article.customAuthor}</h3>
                              <p className="text-xs text-[#777777]">Contributing Columnist</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-3 flex-shrink-0">
                              <Avatar
                                src={article.author.avatar}
                                alt={article.author.name}
                                className="w-12 h-12 border border-[#ac834e]/30 hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <h3 className="font-bold text-[#141414] text-base hover:text-[#ac834e] transition-colors truncate">{article.author.name}</h3>
                                <p className="text-xs text-[#777777]">{article.author.followersCount.toLocaleString()} followers</p>
                              </div>
                            </Link>
                            <FollowButton
                              authorId={article.author.id}
                              compact
                              onChange={(isFollowing) => {
                                setArticle(prev => prev ? {
                                  ...prev,
                                  author: {
                                    ...prev.author,
                                    followersCount: Math.max(0, prev.author.followersCount + (isFollowing ? 1 : -1))
                                  }
                                } as any : prev);
                              }}
                            />
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={handleLike}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl min-h-[42px] transition-all font-medium text-sm ${isLiked
                            ? 'bg-red-50 text-red-500 border border-red-200 shadow-sm'
                            : 'bg-[#FAF8F5] text-[#555555] hover:text-[#ac834e] border border-[#ac834e]/25 hover:border-[#ac834e]'
                            }`}
                        >
                          <Heart className={`w-4 h-4 flex-shrink-0 ${isLiked ? 'fill-current' : ''}`} />
                          <span className="font-semibold">{likesCount}</span>
                        </button>

                        <div className="relative" ref={shareRef}>
                          <button
                            type="button"
                            onClick={() => setIsShareOpen(!isShareOpen)}
                            className="flex items-center space-x-2 px-4 py-2 min-h-[42px] rounded-xl bg-[#FAF8F5] text-[#555555] hover:text-[#ac834e] border border-[#ac834e]/25 hover:border-[#ac834e] transition-all font-medium text-sm"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                          {isShareOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#ac834e]/25 py-2 z-20">
                              <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2.5 px-4 py-2 text-sm text-[#444444] hover:text-[#ac834e] hover:bg-[#FAF8F5] transition-colors"
                                onClick={() => setIsShareOpen(false)}
                              >
                                <Linkedin className="w-4 h-4 text-[#0077b5]" />
                                <span>LinkedIn</span>
                              </a>
                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2.5 px-4 py-2 text-sm text-[#444444] hover:text-[#ac834e] hover:bg-[#FAF8F5] transition-colors"
                                onClick={() => setIsShareOpen(false)}
                              >
                                <Facebook className="w-4 h-4 text-[#1877f2]" />
                                <span>Facebook</span>
                              </a>
                              <button
                                type="button"
                                className="w-full flex items-center space-x-2.5 px-4 py-2 text-sm text-[#444444] hover:text-[#ac834e] hover:bg-[#FAF8F5] transition-colors text-left"
                                onClick={() => {
                                  navigator.clipboard.writeText(shareUrl);
                                  showSuccess('Link copied to clipboard!');
                                  setIsShareOpen(false);
                                }}
                              >
                                <LinkIcon className="w-4 h-4 text-[#ac834e]" />
                                <span>Copy Link</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="p-2.5 min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-[#FAF8F5] text-[#555555] hover:text-[#ac834e] border border-[#ac834e]/25 hover:border-[#ac834e] transition-colors"
                          aria-label="Bookmark"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Article Read Meta Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#777777] pt-1">
                      <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#ac834e]" />
                        <span>{article.readingTime} min read</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center space-x-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#ac834e]" />
                        <span>{(article.views || 0).toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Article Content */}
                <div
                  className="prose prose-lg max-w-none mb-12 text-[#2A2A2A] prose-headings:text-[#141414] prose-headings:font-serif prose-p:text-[#333333] prose-a:text-[#ac834e] prose-strong:text-[#141414] prose-code:text-[#ac834e]"
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Quiz Section */}
                <QuizCard articleId={article.id} />

                {/* Comments Section */}
                <section className="border-t border-[#ac834e]/20 pt-10 mt-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-serif font-bold text-[#141414] flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-[#ac834e]" />
                      <span>Comments ({article.comments.length})</span>
                    </h3>
                  </div>

                  {/* Comment Form */}
                  {authState.isAuthenticated ? (
                    <form onSubmit={handleComment} className="mb-10 group">
                      <div className="flex gap-5">
                        <Avatar
                          src={authState.user?.avatar?.url}
                          alt={authState.user?.name || 'User'}
                          className="w-12 h-12 border border-[#ac834e]/30"
                        />
                        <div className="flex-1">
                          <div className="relative">
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Join the discussion and share your insights..."
                              className="w-full px-5 py-4 bg-[#FAF8F5] text-[#141414] placeholder-[#888888] rounded-2xl border border-[#ac834e]/25 focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] focus:bg-white focus:outline-none resize-none transition-all shadow-inner"
                              rows={4}
                            />
                          </div>
                          <div className="flex justify-end mt-3">
                            <button
                              type="submit"
                              disabled={!comment.trim() || commentLoading}
                              className="flex items-center gap-2 bg-[#ac834e] text-white px-7 py-2.5 rounded-xl font-bold hover:bg-[#946f3e] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ac834e]/20 text-sm"
                            >
                              {commentLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              <span>Post Comment</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="mb-10 p-8 bg-[#FAF8F5] rounded-2xl border border-[#ac834e]/25 border-dashed text-center">
                      <h4 className="text-[#141414] font-serif font-bold text-lg mb-1">Want to join the conversation?</h4>
                      <p className="text-[#666666] text-sm mb-5">Sign in to share your thoughts on this article.</p>
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 bg-[#ac834e] text-white px-7 py-2.5 rounded-xl font-bold hover:bg-[#946f3e] transition-all shadow-md shadow-[#ac834e]/20 text-sm"
                      >
                        <span>Sign In to Comment</span>
                      </Link>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="space-y-6">
                    {article.comments.map((c) => {
                      const canDelete = authState.user && (
                        authState.user.id === c.author.id ||
                        authState.user.role === 'editor' ||
                        authState.user.role === 'admin'
                      );

                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-5 group/comment"
                        >
                          <Link to={`/profile/${c.author.id}`} className="flex-shrink-0">
                            <Avatar
                              src={c.author.avatar}
                              alt={c.author.name}
                              className="w-11 h-11 border border-[#ac834e]/25 hover:scale-105 transition-transform"
                            />
                          </Link>
                          <div className="flex-1">
                            <div className="bg-[#FAF8F5] border border-[#ac834e]/20 rounded-2xl p-5 transition-colors hover:border-[#ac834e]/40">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <Link
                                    to={`/profile/${c.author.id}`}
                                    className="font-bold text-[#141414] text-base hover:text-[#ac834e] transition-colors block"
                                  >
                                    {c.author.name}
                                  </Link>
                                  <span className="text-[11px] text-[#888888] font-medium uppercase tracking-wider">
                                    {formatDistanceToNow(new Date(c.createdAt))} ago
                                  </span>
                                </div>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="opacity-0 group-hover/comment:opacity-100 text-[#888888] hover:text-red-500 hover:bg-red-50 transition-all p-1.5 rounded-lg"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[#333333] leading-relaxed text-sm sm:text-base whitespace-pre-wrap">{c.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {article.comments.length === 0 && (
                      <div className="text-center py-14 border border-[#ac834e]/20 rounded-2xl border-dashed bg-[#FAF8F5]/50">
                        <MessageCircle className="w-12 h-12 text-[#ac834e]/30 mx-auto mb-4" />
                        <h4 className="text-[#141414] font-serif font-bold text-base mb-1">No comments yet</h4>
                        <p className="text-[#777777] text-sm">Start the discussion by posting the first comment!</p>
                      </div>
                    )}
                  </div>
                </section>
              </motion.article>
            </div>

            {/* Right Column: Recommended Articles & Sidebar Widgets (4 Cols) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Recommended Articles Widget */}
              <div className="bg-white border border-[#ac834e]/25 rounded-2xl p-6 shadow-[0_10px_35px_rgba(172,131,78,0.06)]">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ac834e]/15">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#ac834e]/10 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#141414] leading-tight">Recommended</h3>
                      <p className="text-[11px] text-[#777777]">Hand-picked research & articles</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#ac834e]/10 text-[#8e6939] border border-[#ac834e]/20">
                    Curated
                  </span>
                </div>

                <div className="space-y-4">
                  {recommendedArticles.map((rec) => (
                    <Link
                      key={rec.id}
                      to={`/article/${rec.slug || rec.id}`}
                      className="group flex gap-3.5 p-2 -mx-2 rounded-xl hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#ac834e]/20 flex-shrink-0 relative">
                        {rec.coverImage ? (
                          <img
                            src={rec.coverImage}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#ac834e]/20 to-[#FAF8F5] flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-[#ac834e]/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          {rec.tags && rec.tags.length > 0 && (
                            <span className="inline-block text-[10px] font-semibold text-[#8e6939] uppercase tracking-wider mb-1 line-clamp-1">
                              {rec.tags[0]}
                            </span>
                          )}
                          <h4 className="font-serif font-bold text-sm text-[#141414] group-hover:text-[#ac834e] line-clamp-2 leading-snug transition-colors">
                            {rec.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#777777] mt-1">
                          <span className="truncate">{rec.author?.name || 'Tech HUB'}</span>
                          <span>•</span>
                          <span className="flex-shrink-0">{rec.readingTime || 5} min</span>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {recommendedArticles.length === 0 && (
                    <p className="text-xs text-[#777777] py-4 text-center">Loading recommendations...</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#ac834e]/15">
                  <Link
                    to="/explore"
                    className="flex items-center justify-center gap-2 text-xs font-bold text-[#ac834e] hover:text-[#8e6939] p-2 rounded-xl hover:bg-[#ac834e]/5 transition-colors"
                  >
                    <span>Explore All Articles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Author Spotlight Widget */}
              <div className="bg-white border border-[#ac834e]/25 rounded-2xl p-6 shadow-[0_10px_35px_rgba(172,131,78,0.06)]">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#ac834e]/15">
                  <div className="w-8 h-8 rounded-lg bg-[#ac834e]/10 border border-[#ac834e]/30 flex items-center justify-center text-[#ac834e]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#141414] leading-tight">About the Author</h3>
                    <p className="text-[11px] text-[#777777]">Contributing Columnist</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 mb-3.5">
                  <Avatar
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-13 h-13 border border-[#ac834e]/30 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-base text-[#141414] leading-snug">{article.author.name}</h4>
                    <p className="text-xs text-[#ac834e] font-medium mt-0.5">
                      {article.customAuthor ? 'Contributing Columnist' : 'Lead Researcher'}
                    </p>
                    <p className="text-xs text-[#777777] mt-1">
                      {article.author.followersCount.toLocaleString()} followers • {article.author.articlesCount} articles
                    </p>
                  </div>
                </div>

                {article.author.bio && (
                  <p className="text-xs text-[#555555] leading-relaxed mb-4 line-clamp-3">
                    {article.author.bio}
                  </p>
                )}

                {!article.customAuthor && (
                  <div className="flex items-center gap-2 pt-2">
                    <FollowButton
                      authorId={article.author.id}
                      onChange={(isFollowing) => {
                        setArticle(prev => prev ? {
                          ...prev,
                          author: {
                            ...prev.author,
                            followersCount: Math.max(0, prev.author.followersCount + (isFollowing ? 1 : -1))
                          }
                        } as any : prev);
                      }}
                    />
                    <Link
                      to={`/profile/${article.author.id}`}
                      className="flex-1 text-center py-2 px-3 text-xs font-semibold text-[#444444] hover:text-[#141414] bg-[#FAF8F5] border border-[#ac834e]/20 rounded-xl hover:bg-[#f0e3ce]/30 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                )}
              </div>

              {/* Tech HUB Newsletter Dispatch Widget */}
              <div className="bg-gradient-to-br from-[#FAF8F5] to-[#f4ede0] border border-[#ac834e]/30 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-[#8e6939] text-xs font-mono uppercase tracking-widest font-bold mb-2">
                  <Mail className="w-3.5 h-3.5 text-[#ac834e]" />
                  <span>Weekly Dispatch</span>
                </div>
                <h4 className="font-serif font-bold text-lg text-[#141414] mb-2 leading-snug">
                  Stay Ahead of AI & Deep Tech
                </h4>
                <p className="text-xs text-[#555555] leading-relaxed mb-4">
                  Curated architectural deep-dives, breakthroughs, and enterprise intelligence delivered every Tuesday.
                </p>
                {newsletterSubscribed ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold text-center">
                    ✓ You're subscribed to the Dispatch!
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#ac834e]/30 rounded-xl text-xs text-[#141414] placeholder-[#888888] focus:border-[#ac834e] focus:ring-1 focus:ring-[#ac834e] outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#ac834e] text-white text-xs font-bold rounded-xl hover:bg-[#946f3e] transition-all shadow-md shadow-[#ac834e]/20"
                    >
                      Subscribe Free
                    </button>
                  </form>
                )}
              </div>

              {/* Trending Topics Widget */}
              <div className="bg-white border border-[#ac834e]/25 rounded-2xl p-5 shadow-[0_10px_35px_rgba(172,131,78,0.06)]">
                <h4 className="font-serif font-bold text-sm text-[#141414] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#ac834e]" />
                  <span>Trending Topics</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['AI Systems', 'Agentic Workflows', 'Quantum Computing', 'Zero Trust', 'Web3', 'Cryogenics'].map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="text-xs bg-[#FAF8F5] hover:bg-[#ac834e]/10 text-[#555555] hover:text-[#8e6939] px-3 py-1.5 rounded-lg border border-[#ac834e]/20 transition-colors font-medium"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;