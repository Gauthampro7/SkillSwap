import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { skillsService } from '../services/skillsService';

const CATEGORIES = ['Tech', 'Arts', 'Academic', 'Life Skills'];
const TYPES = ['Offering', 'Seeking'];

export const CreateSkillModal = ({ isOpen, onClose, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Tech',
    type: 'Offering',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await skillsService.createSkill(formData);
      setFormData({
        title: '',
        description: '',
        category: 'Tech',
        type: 'Offering',
        location: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-3xl p-4 sm:p-8 max-w-md w-full relative overflow-hidden my-4 max-h-[90dvh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-theme-secondary hover:text-theme transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold text-theme mb-6">Create New Skill</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-theme mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 glass rounded-lg text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme"
                    placeholder="e.g., React Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-theme mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 glass rounded-lg text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme resize-none"
                    placeholder="Describe your skill..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-theme mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 glass rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-accent-theme"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-theme mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-2 glass rounded-lg text-theme focus:outline-none focus:ring-2 focus:ring-accent-theme"
                    >
                      {TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-theme mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 glass rounded-lg text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme"
                    placeholder="e.g., MIT"
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-accent-theme text-white rounded-xl font-semibold hover:glow-theme transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Create Skill
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
