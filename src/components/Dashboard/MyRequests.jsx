import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, X, Loader2, Check, MessageCircle } from 'lucide-react';
import { tradesService } from '../../services/tradesService';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400 bg-yellow-500/20' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-green-400 bg-green-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/20' },
  declined: { label: 'Declined', icon: XCircle, color: 'text-red-400 bg-red-500/20' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-theme-secondary bg-theme-secondary/20' },
};

export function MyRequests({ onOpenChat }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [completing, setCompleting] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradesService.getMyRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request?')) return;
    try {
      setCancelling(id);
      await tradesService.cancel(id);
      await fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const handleMarkCompleted = async (id) => {
    try {
      setCompleting(id);
      await tradesService.markCompleted(id);
      await fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-theme">Requests I sent</h2>
      <p className="text-sm text-theme-secondary">
        Trade requests you’ve made. You can cancel pending requests.
      </p>

      {error && (
        <div className="glass p-4 rounded-xl border border-red-500/30 text-red-400">{error}</div>
      )}

      {requests.length === 0 && !error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Send className="w-12 h-12 text-theme-secondary mx-auto mb-4 opacity-60" />
          <p className="text-theme-secondary">You haven’t sent any trade requests yet.</p>
          <p className="text-sm text-theme-secondary mt-1">Request a trade from a skill card on the Browse page.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-theme truncate">{req.skill?.title}</h3>
                  <p className="text-sm text-theme-secondary line-clamp-2 mt-0.5">
                    {req.skill?.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent-theme/20 text-accent-theme">
                      {req.skill?.category}
                    </span>
                    <span className="text-xs text-theme-secondary">
                      by {req.skill?.userData?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}
                  >
                    <Icon size={14} />
                    {config.label}
                  </span>
                  {req.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCancel(req.id)}
                      disabled={cancelling === req.id}
                      className="px-3 py-1.5 rounded-lg glass text-theme-secondary hover:text-red-400 text-sm disabled:opacity-50"
                    >
                      {cancelling === req.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        'Cancel'
                      )}
                    </motion.button>
                  )}
                  {req.status === 'accepted' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onOpenChat?.(req)}
                        className="px-3 py-1.5 rounded-lg bg-accent-theme/20 text-accent-theme text-sm font-medium flex items-center gap-1.5"
                      >
                        <MessageCircle size={14} />
                        Message
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMarkCompleted(req.id)}
                        disabled={completing === req.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium disabled:opacity-50"
                      >
                        {completing === req.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Check size={14} className="inline mr-1" />
                            Mark completed
                          </>
                        )}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
