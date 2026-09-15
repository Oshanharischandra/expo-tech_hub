import React, { useState } from 'react';
import { motion } from 'framer-motion';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SidebarProps {
  currentCategory?: string;
  onCategoryChange?: (category: string) => void;
}

const CATEGORIES = ["All Events", "Workshops", "Competitions", "Meetups"];

const Sidebar: React.FC<SidebarProps> = ({ currentCategory = 'All Events', onCategoryChange }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) return;
    setNewsletterSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    setNewsletterSubscribed(true);
    setNewsletterSubmitting(false);
  };

  return (
    <aside className="w-full max-w-80 space-y-6">
      {/* Event Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-900/50 border border-dark-800 rounded-xl p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Event Categories</h3>
        </div>
        <div className="space-y-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange?.(category)}
              className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentCategory === category
                  ? 'bg-primary-900/30 text-primary-400 font-medium'
                  : 'text-gray-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Newsletter Signup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-primary-900/20 to-primary-800/20 border border-primary-800/30 rounded-lg p-6"
      >
        {newsletterSubscribed ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="text-4xl mb-3 font-bold text-green-500">✓</div>
            <h3 className="text-lg font-semibold text-white mb-1">You're subscribed!</h3>
            <p className="text-gray-300 text-sm">
              Look out for our best reads in your inbox.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-2">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-4">
              Get the latest events and insights delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                disabled={newsletterSubmitting}
              />
              <button
                type="submit"
                disabled={newsletterSubmitting}
                className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </aside>
  );
};

export default Sidebar;