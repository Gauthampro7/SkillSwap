import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Bookmark, Code, Palette, BookOpen, Heart, Layers } from 'lucide-react';
import { useState } from 'react';

const CATEGORY_CONFIG = {
  Tech:          { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   Icon: Code },
  Arts:          { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', Icon: Palette },
  Academic:      { color: 'bg-green-500/20 text-green-400 border-green-500/30',  Icon: BookOpen },
  'Life Skills': { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', Icon: Heart },
};

const DEFAULT_CATEGORY = { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', Icon: Layers };

export const SkillCard = ({ skill, index, onRequestTrade, onCardClick, isSaved, onSave, onUnsave, onUserClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { color: categoryColor, Icon: CategoryIcon } = CATEGORY_CONFIG[skill.category] || DEFAULT_CATEGORY;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const avatarUrl = skill.userData?.picture;
  const userName  = skill.userData?.name || skill.user || 'Unknown';
  const userLocation = skill.location || skill.userData?.location;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={() => onCardClick?.(skill)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick?.(skill)}
      className={`glass-card rounded-2xl p-6 cursor-pointer group relative overflow-hidden flex flex-col ${
        skill.type === 'Offering' ? 'card-offering' : 'card-seeking'
      }`}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{
          rotateX: isHovered ? mousePosition.y * -10 : 0,
          rotateY: isHovered ? mousePosition.x * 10  : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="flex flex-col flex-1"
      >
        {/* Badges + Bookmark */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${categoryColor}`}>
              <CategoryIcon size={12} />
              {skill.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                skill.type === 'Offering'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}
            >
              {skill.type}
            </span>
          </div>

          {(onSave || onUnsave) && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                if (isSaved) onUnsave?.(skill.id);
                else onSave?.(skill.id);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isSaved
                  ? 'text-accent-theme bg-accent-theme/20'
                  : 'text-theme-secondary hover:text-theme hover:bg-accent-theme/10'
              }`}
              aria-label={isSaved ? 'Unsave' : 'Save'}
            >
              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            </motion.button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-theme mb-2 leading-snug">{skill.title}</h3>

        {/* Description — clamped to 3 lines for uniform card height */}
        <p className="text-theme-secondary text-sm mb-4 flex-grow line-clamp-3">
          {skill.description}
        </p>

        {/* User Info with avatar */}
        <div className="flex items-center gap-3 mb-4 text-theme-secondary text-sm">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUserClick?.(skill.userData || { id: skill.user_id, name: skill.user });
            }}
            className="flex items-center gap-2 hover:text-theme transition-colors text-left"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-accent-theme/30"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-accent-theme/20 flex items-center justify-center text-accent-theme text-xs font-bold ring-1 ring-accent-theme/30">
                {userName[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-medium">{userName}</span>
          </button>

          {userLocation && (
            <div className="flex items-center gap-1 ml-auto">
              <MapPin size={14} />
              <span className="truncate max-w-[100px]">{userLocation}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onRequestTrade?.(skill);
          }}
          className="btn-gradient flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold w-full min-h-[44px] touch-manipulation"
        >
          Request Trade
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      {/* Radial glow on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 80%, var(--glow) 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  );
};
