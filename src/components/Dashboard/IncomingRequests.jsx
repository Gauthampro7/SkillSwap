import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Check, X, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import { tradesService } from '../../services/tradesService';

export function IncomingRequests({ onOpenChat }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [completing, setCompleting] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradesService.getIncomingRequests();
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

  const handleAccept = async (id) => {
    try {
      setActing(id);
      await tradesService.accept(id);
      await fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (id) => {
    try {
      setActing(id);
      await tradesService.decline(id);
      await fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
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

  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-theme">Requests I received</h2>
      <p className="text-sm text-theme-secondary">
        Others requested to trade for your skills. Accept or decline below.
      </p>

      {error && (
        <div className="glass p-4 rounded-xl border border-red-500/30 text-red-400">{error}</div>
      )}

      {requests.length === 0 && !error ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Inbox className="w-12 h-12 text-theme-secondary mx-auto mb-4 opacity-60" />
          <p className="text-theme-secondary">No incoming requests yet.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide">
                Pending ({pending.length})
              </h3>
              {pending.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {req.requester?.picture ? (
                          <img
                            src={req.requester.picture}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-accent-theme/20 flex items-center justify-center text-accent-theme font-bold">
                            {(req.requester?.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-theme">{req.requester?.name || 'Someone'}</p>
                          <p className="text-xs text-theme-secondary">{req.requester?.email}</p>
                        </div>
                      </div>
                      <p className="text-sm text-theme-secondary mt-1">
                        Wants to trade for: <strong className="text-theme">{req.skill?.title}</strong>
                      </p>
                      {req.message && (
                        <p className="text-sm text-theme-secondary mt-2 italic">"{req.message}"</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAccept(req.id)}
                        disabled={acting === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium text-sm disabled:opacity-50"
                      >
                        {acting === req.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Check size={16} />
                            Accept
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDecline(req.id)}
                        disabled={acting === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg glass text-red-400 font-medium text-sm hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <X size={16} />
                        Decline
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-theme-secondary uppercase tracking-wide">
                Past requests
              </h3>
              {resolved.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (pending.length + i) * 0.05 }}
                  className="glass rounded-2xl p-4 opacity-80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-theme">
                      {req.requester?.name || 'Someone'} → {req.skill?.title}
                    </p>
                    <p className="text-sm text-theme-secondary capitalize">{req.status}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {req.status === 'accepted' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onOpenChat?.(req)}
                          className="px-3 py-1.5 rounded-lg bg-accent-theme/20 text-accent-theme text-sm font-medium flex items-center gap-1"
                        >
                          <MessageCircle size={14} />
                          Message
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMarkCompleted(req.id)}
                          disabled={completing === req.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        >
                          {completing === req.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={14} />
                              Mark completed
                            </>
                          )}
                        </motion.button>
                      </>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : req.status === 'accepted'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
