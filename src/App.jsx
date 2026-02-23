import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeSelector } from './components/ThemeSelector';
import { LoginButton } from './components/LoginButton';
import { SearchFilter } from './components/SearchFilter';
import { BentoGrid } from './components/BentoGrid';
import { SkillCard } from './components/SkillCard';
import { TradeModal } from './components/TradeModal';
import { RequestTradeModal } from './components/RequestTradeModal';
import { CreateSkillModal } from './components/CreateSkillModal';
import { skillsService } from './services/skillsService';
import { savedSkillsService } from './services/savedSkillsService';
import { tradesService } from './services/tradesService';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProfileModal } from './components/ProfileModal';
import { SkillDetailModal } from './components/SkillDetailModal';
import { EditProfileModal } from './components/EditProfileModal';
import { Sparkles, Plus, Loader2, LayoutDashboard, Compass, Zap, Users, ArrowRight } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const [view, setView] = useState('browse'); // 'browse' | 'dashboard'
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'All', type: 'All', university: 'All' });
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillForRequest, setSkillForRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [profileUserId, setProfileUserId] = useState(null);
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'
  const [detailSkill, setDetailSkill] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Fetch skills from API
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedSkills = await skillsService.getSkills({
          search: searchQuery,
          category: filters.category,
          type: filters.type,
        });
        setSkills(fetchedSkills);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError(err.message || 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [searchQuery, filters.category, filters.type]);

  // Fetch saved skill IDs when logged in
  useEffect(() => {
    if (!isAuthenticated) {
      setSavedIds([]);
      return;
    }
    savedSkillsService
      .getSavedIds()
      .then(setSavedIds)
      .catch(() => setSavedIds([]));
  }, [isAuthenticated, view]);

  // Pending incoming requests count (for notification badge)
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingIncomingCount(0);
      return;
    }
    tradesService
      .getIncomingRequests()
      .then((requests) => setPendingIncomingCount(requests.filter((r) => r.status === 'pending').length))
      .catch(() => setPendingIncomingCount(0));
  }, [isAuthenticated, view]);

  // Open skill detail from hash (#skill-<id>); react to both skills load and hash changes
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash;
      const match = hash && hash.startsWith('#skill-') && hash.slice(7);
      if (match && skills.length > 0) {
        const skill = skills.find((s) => s.id === match);
        if (skill) setDetailSkill(skill);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [skills]);

  const universities = useMemo(() => {
    const set = new Set();
    skills.forEach((s) => {
      const u = s.userData?.university || s.userData?.location;
      if (u && String(u).trim()) set.add(String(u).trim());
    });
    return ['All', ...[...set].sort()];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let list = skills;
    if (filters.university && filters.university !== 'All') {
      list = list.filter((s) => {
        const u = s.userData?.university || s.userData?.location;
        return u && String(u).trim() === filters.university;
      });
    }
    return list;
  }, [skills, filters.university]);

  const sortedSkills = useMemo(() => {
    const list = [...filteredSkills];
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
    }
    return list;
  }, [filteredSkills, sortBy]);

  const handleOpenRequestModal = (skill) => {
    setSkillForRequest(skill);
    setIsRequestModalOpen(true);
  };

  const handleSubmitTradeRequest = async (skill, message) => {
    await skillsService.requestTrade(skill.id, message);
    setSelectedSkill(skill);
    setIsModalOpen(true);
  };

  const handleSave = async (skillId) => {
    try {
      await savedSkillsService.save(skillId);
      setSavedIds((prev) => [...prev, skillId]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnsave = async (skillId) => {
    try {
      await savedSkillsService.unsave(skillId);
      setSavedIds((prev) => prev.filter((id) => id !== skillId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSkill(null), 300);
  };

  const handleCreateSuccess = () => {
    // Refresh skills list
    const fetchSkills = async () => {
      try {
        const fetchedSkills = await skillsService.getSkills({
          search: searchQuery,
          category: filters.category,
          type: filters.type,
        });
        setSkills(fetchedSkills);
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };
    fetchSkills();
  };

  return (
    <div className="min-h-screen bg-theme transition-colors duration-300 relative">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-theme backdrop-blur-xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent-theme/20 rounded-lg blur-lg" />
                <div className="relative bg-accent-theme/10 p-2 rounded-lg">
                  <Sparkles className="text-accent-theme" size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-theme">SkillSwap</h1>
                <p className="text-xs text-theme-secondary">Exchange skills with students</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView(view === 'dashboard' ? 'browse' : 'dashboard')}
                  className={`relative flex items-center gap-2 glass px-4 py-2 rounded-lg font-medium ${
                    view === 'dashboard'
                      ? 'bg-accent-theme text-white'
                      : 'text-theme hover:bg-accent-theme/10'
                  }`}
                >
                  {view === 'dashboard' ? (
                    <>
                      <Compass size={18} />
                      Browse
                    </>
                  ) : (
                    <>
                      <LayoutDashboard size={18} />
                      Dashboard
                      {pendingIncomingCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                          {pendingIncomingCount > 99 ? '99+' : pendingIncomingCount}
                        </span>
                      )}
                    </>
                  )}
                </motion.button>
              )}
              <LoginButton onOpenProfile={() => currentUser?.id && setProfileUserId(currentUser.id)} />
              <ThemeSelector />
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {view === 'dashboard' ? (
          <Dashboard
            onGoToBrowse={() => setView('browse')}
            onRequestTrade={handleOpenRequestModal}
            onUnsave={handleUnsave}
            refreshSavedIds={() => savedSkillsService.getSavedIds().then(setSavedIds)}
          />
        ) : (
          <>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 pt-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="hero-badge inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-medium text-theme mb-6 border border-accent-theme/30"
          >
            <Zap size={14} className="text-accent-theme shrink-0" />
            Student Skill Exchange Platform
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-6xl font-extrabold text-theme mb-4 leading-tight"
          >
            Exchange Skills,{' '}
            <span className="gradient-text">Grow Together</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg text-theme-secondary max-w-xl mx-auto mb-8"
          >
            Connect with students who have what you need. Offer what you know, discover what you don't.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-theme-secondary">
              <Sparkles size={16} className="text-accent-theme" />
              <span>{loading ? '...' : filteredSkills.length} skills available</span>
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-theme-secondary">
              <Users size={16} className="text-accent-theme" />
              <span>Free to join</span>
            </div>
            {!isAuthenticated && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 btn-gradient text-white px-5 py-2 rounded-full text-sm font-semibold cursor-pointer"
                onClick={() => {}}
              >
                Get started <ArrowRight size={14} />
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SearchFilter
            onSearch={setSearchQuery}
            onFilterChange={setFilters}
            universities={universities}
            selectedCategory={filters.category}
            selectedType={filters.type}
            selectedUniversity={filters.university}
          />
        </motion.div>

        {/* Quick category chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 flex flex-wrap items-center gap-2"
        >
          <span className="text-sm text-theme-secondary mr-1">Quick filter:</span>
          {['Tech', 'Arts', 'Academic', 'Life Skills'].map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilters((prev) => ({ ...prev, category: prev.category === cat ? 'All' : cat }))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filters.category === cat ? 'bg-accent-theme text-white' : 'glass text-theme hover:bg-accent-theme/10'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Results Count, Sort, and Create Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-4"
        >
          <p className="text-theme-secondary">
            {loading ? 'Loading...' : `${sortedSkills.length} ${sortedSkills.length === 1 ? 'skill' : 'skills'} found`}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="glass px-3 py-2 rounded-lg text-theme text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-theme"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors font-medium"
            >
              <Plus size={18} />
              Create Skill
            </motion.button>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass p-4 rounded-xl border border-red-500/30"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-theme animate-spin" />
          </div>
        )}

        {/* Skills Grid */}
        {!loading && sortedSkills.length > 0 ? (
          <BentoGrid>
            {sortedSkills.map((skill, index) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                index={index}
                onRequestTrade={handleOpenRequestModal}
                onCardClick={() => setDetailSkill(skill)}
                isSaved={savedIds.includes(skill.id)}
                onSave={isAuthenticated ? handleSave : undefined}
                onUnsave={isAuthenticated ? handleUnsave : undefined}
                onUserClick={(user) => user?.id && setProfileUserId(user.id)}
              />
            ))}
          </BentoGrid>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="glass rounded-2xl p-12 max-w-md mx-auto">
              <p className="text-2xl font-bold text-theme mb-2">No skills found</p>
              <p className="text-theme-secondary">
                Try adjusting your search or filters
              </p>
            </div>
          </motion.div>
        )}
          </>
        )}
      </main>

      {/* Request Trade Modal (optional message) */}
      <RequestTradeModal
        isOpen={isRequestModalOpen}
        onClose={() => { setIsRequestModalOpen(false); setSkillForRequest(null); }}
        skill={skillForRequest}
        onSubmit={handleSubmitTradeRequest}
      />

      <ProfileModal
        isOpen={!!profileUserId}
        onClose={() => setProfileUserId(null)}
        userId={profileUserId}
        currentUserId={currentUser?.id}
        onEditProfile={() => { setProfileUserId(null); setIsEditProfileOpen(true); }}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={() => setIsEditProfileOpen(false)}
      />

      <SkillDetailModal
        isOpen={!!detailSkill}
        onClose={() => setDetailSkill(null)}
        skill={detailSkill}
        onRequestTrade={handleOpenRequestModal}
        isSaved={detailSkill ? savedIds.includes(detailSkill.id) : false}
        onSave={isAuthenticated ? handleSave : undefined}
        onUnsave={isAuthenticated ? handleUnsave : undefined}
        onUserClick={(user) => user?.id && setProfileUserId(user.id)}
        isAuthenticated={isAuthenticated}
      />

      {/* Trade success Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        skill={selectedSkill}
        onViewDashboard={() => setView('dashboard')}
      />

      {/* Create Skill Modal */}
      <CreateSkillModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
