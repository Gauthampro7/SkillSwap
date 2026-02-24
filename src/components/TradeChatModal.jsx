import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User, Copy, Check } from 'lucide-react';
import { tradeChatService } from '../services/tradeChatService';

const MAX_LENGTH = 2000;

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function TradeChatModal({ isOpen, onClose, tradeRequest, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const otherParty =
    tradeRequest?.requesterId === currentUserId
      ? tradeRequest?.skill?.userData
      : tradeRequest?.requester;
  const otherName = otherParty?.name || 'Trade partner';
  const otherPicture = otherParty?.picture;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !tradeRequest?.id) return;
    setLoading(true);
    setError(null);
    tradeChatService
      .getMessages(tradeRequest.id)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, tradeRequest?.id]);

  useEffect(() => {
    if (!isOpen || !tradeRequest?.id) return;
    unsubscribeRef.current = tradeChatService.subscribeToMessages(tradeRequest.id, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });
    return () => {
      unsubscribeRef.current?.();
    };
  }, [isOpen, tradeRequest?.id]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !tradeRequest?.id) return;
    setSending(true);
    setError(null);
    try {
      const msg = await tradeChatService.sendMessage(tradeRequest.id, trimmed);
      setMessages((prev) => [...prev, msg]);
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (msg) => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  if (!tradeRequest) return null;

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
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-2xl w-full max-w-lg flex flex-col max-h-[85dvh] sm:max-h-[85vh] overflow-hidden mx-1 sm:mx-0">
              {/* Header */}
              <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-theme shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {otherPicture ? (
                    <img
                      src={otherPicture}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent-theme/20 flex items-center justify-center shrink-0">
                      <User size={20} className="text-accent-theme" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-theme truncate">{otherName}</p>
                    <p className="text-xs text-theme-secondary truncate">
                      Trade: {tradeRequest.skill?.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-theme-secondary hover:text-theme rounded-lg shrink-0"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {loading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
                  </div>
                )}
                {!loading && error && (
                  <p className="text-red-400 text-sm text-center py-2">{error}</p>
                )}
                {!loading && !error && messages.length === 0 && (
                  <div className="text-center py-8 text-theme-secondary text-sm">
                    No messages yet. Say hi to coordinate your trade!
                  </div>
                )}
                {!loading &&
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-accent-theme text-white rounded-br-md'
                              : 'glass text-theme rounded-bl-md'
                          }`}
                        >
                          {!isMe && msg.sender?.name && (
                            <p className="text-xs opacity-80 mb-0.5">{msg.sender.name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span
                              className={`text-[10px] opacity-70 ${
                                isMe ? 'text-white/80' : 'text-theme-secondary'
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyMessage(msg)}
                              className={`opacity-70 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 p-1.5 rounded min-h-[32px] min-w-[32px] inline-flex items-center justify-center transition-opacity touch-manipulation ${
                                isMe ? 'hover:bg-white/20' : 'hover:bg-theme/10'
                              }`}
                              aria-label="Copy message"
                            >
                              {copiedId === msg.id ? (
                                <Check size={12} />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-theme shrink-0">
                {error && (
                  <p className="text-red-400 text-xs mb-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="flex-1 resize-none px-4 py-2.5 glass rounded-xl text-theme placeholder:text-theme-secondary focus:outline-none focus:ring-2 focus:ring-accent-theme text-sm"
                    disabled={sending}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="btn-gradient text-white p-2.5 rounded-xl shrink-0 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    aria-label="Send"
                  >
                    {sending ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </motion.button>
                </div>
                <p className="text-[10px] text-theme-secondary mt-1 text-right">
                  {input.length}/{MAX_LENGTH}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
