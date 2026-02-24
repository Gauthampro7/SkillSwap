import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { skillsService } from '../services/skillsService';

export const ProfileModal = ({ isOpen, onClose, userId, currentUserId, onEditProfile }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setError(null);
    skillsService
      .getProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  if (!userId) return null;

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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-2xl p-4 sm:p-6 max-w-lg w-full relative my-4 sm:my-8 max-h-[90dvh] overflow-y-auto">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-theme-secondary hover:text-theme transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
                </div>
              )}

              {error && (
                <p className="text-red-400 py-4">{error}</p>
              )}

              {profile && !loading && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {profile.user.picture ? (
                      <img
                        src={profile.user.picture}
                        alt=""
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-accent-theme/20 flex items-center justify-center">
                        <User size={32} className="text-accent-theme" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-theme">{profile.user.name}</h2>
                      {(profile.user.university || profile.user.location) && (
                        <div className="flex items-center gap-1 text-theme-secondary text-sm mt-1">
                          <MapPin size={14} />
                          {[profile.user.university, profile.user.location].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {currentUserId === profile.user.id && onEditProfile && (
                        <button
                          type="button"
                          onClick={onEditProfile}
                          className="mt-2 text-sm font-medium text-accent-theme hover:underline"
                        >
                          Edit profile
                        </button>
                      )}
                    </div>
                  </div>

                  {profile.user.bio && (
                    <p className="text-theme-secondary text-sm whitespace-pre-wrap">{profile.user.bio}</p>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Briefcase size={16} />
                      Skills ({profile.skills.length})
                    </h3>
                    {profile.skills.length === 0 ? (
                      <p className="text-theme-secondary text-sm">No public skills yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {profile.skills.map((s) => (
                          <li
                            key={s.id}
                            className="glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-medium text-theme">{s.title}</p>
                              <p className="text-sm text-theme-secondary line-clamp-1">{s.description}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-accent-theme/20 text-accent-theme">
                              {s.category} · {s.type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
