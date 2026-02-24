import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Bookmark, ArrowRight, Share2, Check } from 'lucide-react';
import { Code, Palette, BookOpen, Heart, Layers } from 'lucide-react';

const CATEGORY_CONFIG = {
  Tech:          { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   Icon: Code },
  Arts:          { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', Icon: Palette },
  Academic:      { color: 'bg-green-500/20 text-green-400 border-green-500/30',  Icon: BookOpen },
  'Life Skills': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', Icon: Heart },
};
const DEFAULT_CATEGORY = { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', Icon: Layers };

export const SkillDetailModal = ({
  isOpen,
  onClose,
  skill,
  onRequestTrade,
  isSaved,
  onSave,
  onUnsave,
  onUserClick,
  isAuthenticated,
}) => {
  const [copied, setCopied] = useState(false);

  if (!skill) return null;

  const { color: categoryColor, Icon: CategoryIcon } = CATEGORY_CONFIG[skill.category] || DEFAULT_CATEGORY;
  const avatarUrl = skill.userData?.picture;
  const userName = skill.userData?.name || skill.user || 'Unknown';
  const userLocation = skill.location || skill.userData?.location || skill.userData?.university;

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}#skill-${skill.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: skill.title,
          text: skill.description?.slice(0, 100) + '…',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-2xl p-4 sm:p-6 max-w-lg w-full relative my-4 sm:my-8 max-h-[90dvh] overflow-y-auto mx-2 sm:mx-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor}`}>
                    <CategoryIcon size={12} />
                    {skill.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      skill.type === 'Offering' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {skill.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(onSave || onUnsave) && isAuthenticated && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => (isSaved ? onUnsave?.(skill.id) : onSave?.(skill.id))}
                      className={`p-2 rounded-lg transition-colors ${
                        isSaved ? 'text-accent-theme bg-accent-theme/20' : 'text-theme-secondary hover:text-theme hover:bg-accent-theme/10'
                      }`}
                      aria-label={isSaved ? 'Unsave' : 'Save'}
                    >
                      <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 rounded-lg text-theme-secondary hover:text-theme hover:bg-accent-theme/10 transition-colors"
                    aria-label="Share"
                  >
                    {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
                  </motion.button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-theme-secondary hover:text-theme transition-colors rounded-lg"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-theme mb-3">{skill.title}</h2>
              <p className="text-theme-secondary whitespace-pre-wrap mb-6">{skill.description}</p>

              {userLocation && (
                <div className="flex items-center gap-2 text-theme-secondary text-sm mb-6">
                  <MapPin size={16} />
                  <span>{userLocation}</span>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 glass rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => onUserClick?.(skill.userData || { id: skill.user_id, name: skill.user })}
                  className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-accent-theme/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent-theme/20 flex items-center justify-center text-accent-theme text-lg font-bold ring-2 ring-accent-theme/30">
                      {userName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-theme">{userName}</p>
                    <p className="text-sm text-theme-secondary flex items-center gap-1">
                      <User size={14} />
                      View profile
                    </p>
                  </div>
                </button>
              </div>

              {isAuthenticated && (
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onRequestTrade(skill);
                    onClose();
                  }}
                  className="btn-gradient flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold w-full"
                >
                  Request Trade
                  <ArrowRight size={18} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
