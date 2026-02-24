import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

export const RequestTradeModal = ({ isOpen, onClose, skill, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(skill, message.trim());
      setMessage('');
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    onClose();
  };

  if (!skill) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-2xl p-4 sm:p-6 max-w-md w-full relative my-auto max-h-[90dvh] overflow-y-auto">
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 text-theme-secondary hover:text-theme transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold text-theme mb-1">Request trade</h2>
              <p className="text-sm text-theme-secondary mb-4">
                Requesting: <strong className="text-theme">{skill.title}</strong>
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Message <span className="text-theme-secondary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. When are you free? I can do weekends."
                    rows={3}
                    className="w-full px-4 py-3 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl glass text-theme font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 rounded-xl bg-accent-theme text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Send request
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
