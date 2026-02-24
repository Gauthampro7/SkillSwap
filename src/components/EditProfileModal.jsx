import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { skillsService } from '../services/skillsService';
import { useAuth } from '../contexts/AuthContext';

export const EditProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ university: '', location: '', bio: '' });

  useEffect(() => {
    if (!isOpen || !authUser?.id) return;
    setLoading(true);
    setError(null);
    skillsService
      .getProfile(authUser.id)
      .then((profile) => {
        setForm({
          university: profile.user.university || '',
          location: profile.user.location || '',
          bio: profile.user.bio || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, authUser?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await skillsService.updateProfile(form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
        <div className="glass rounded-2xl p-4 sm:p-6 max-w-md w-full relative my-4 max-h-[90dvh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-theme">Edit profile</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-theme-secondary hover:text-theme rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
            </div>
          )}

          {!loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-theme mb-1">University / Campus</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
                  placeholder="e.g. State University"
                  className="w-full px-4 py-2.5 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. New York"
                  className="w-full px-4 py-2.5 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="A short intro or what you like to trade..."
                  rows={4}
                  className="w-full px-4 py-2.5 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme resize-none text-base"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 glass rounded-xl text-theme font-medium hover:bg-accent-theme/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-gradient text-white px-4 py-2.5 rounded-xl font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
