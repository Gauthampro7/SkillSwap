import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Briefcase, Send, Inbox, Compass, Bookmark } from 'lucide-react';
import { MySkills } from './MySkills';
import { MyRequests } from './MyRequests';
import { IncomingRequests } from './IncomingRequests';
import { SavedSkills } from './SavedSkills';
import { TradeChatModal } from '../TradeChatModal';
import { useAuth } from '../../contexts/AuthContext';
import { skillsService } from '../../services/skillsService';
import { savedSkillsService } from '../../services/savedSkillsService';
import { tradesService } from '../../services/tradesService';

const TABS = [
  { id: 'my-skills', label: 'My Skills', icon: Briefcase },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'my-requests', label: 'Requests I sent', icon: Send },
  { id: 'incoming', label: 'Requests I received', icon: Inbox },
];

export function Dashboard({ onGoToBrowse, onRequestTrade, onUnsave, refreshSavedIds }) {
  const { isAuthenticated, user: currentUser } = useAuth();
  const [tab, setTab] = useState('my-skills');
  const [stats, setStats] = useState({ mySkills: 0, saved: 0, sent: 0, incoming: 0 });
  const [chatTradeRequest, setChatTradeRequest] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      skillsService.getMySkills().then((d) => d.length),
      savedSkillsService.getSavedIds().then((d) => d.length),
      tradesService.getMyRequests().then((d) => d.length),
      tradesService.getIncomingRequests().then((d) => d.length),
    ])
      .then(([mySkills, saved, sent, incoming]) => setStats({ mySkills, saved, sent, incoming }))
      .catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <LayoutDashboard className="w-12 h-12 text-theme-secondary mx-auto mb-4 opacity-60" />
        <p className="text-theme mb-2">Log in to see your dashboard</p>
        <p className="text-sm text-theme-secondary">My Skills, your requests, and incoming requests appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-theme flex items-center gap-2">
          <LayoutDashboard size={28} />
          Dashboard
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGoToBrowse}
          className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 font-medium"
        >
          <Compass size={18} />
          Browse skills
        </motion.button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'my-skills', label: 'My skills', value: stats.mySkills, icon: Briefcase },
          { key: 'saved', label: 'Saved', value: stats.saved, icon: Bookmark },
          { key: 'my-requests', label: 'Sent', value: stats.sent, icon: Send },
          { key: 'incoming', label: 'Received', value: stats.incoming, icon: Inbox },
        ].map(({ key, label, value, icon: Icon }) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon size={18} className="text-accent-theme" />
              <span className="text-sm font-medium text-theme-secondary">{label}</span>
            </div>
            <p className="text-2xl font-bold text-theme">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-theme pb-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                tab === t.id
                  ? 'bg-accent-theme text-white'
                  : 'glass text-theme hover:bg-accent-theme/10'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </motion.button>
          );
        })}
      </div>

      {tab === 'my-skills' && <MySkills />}
      {tab === 'saved' && (
        <SavedSkills
          onRequestTrade={onRequestTrade}
          onUnsave={onUnsave}
          savedIds={[]}
          refreshSavedIds={refreshSavedIds}
        />
      )}
      {tab === 'my-requests' && (
        <MyRequests onOpenChat={setChatTradeRequest} />
      )}
      {tab === 'incoming' && (
        <IncomingRequests onOpenChat={setChatTradeRequest} />
      )}

      <TradeChatModal
        isOpen={!!chatTradeRequest}
        onClose={() => setChatTradeRequest(null)}
        tradeRequest={chatTradeRequest}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
