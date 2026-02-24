import { motion } from 'framer-motion';
import { LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton = ({ onOpenProfile }) => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="glass p-2 rounded-lg">
        <div className="w-6 h-6 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onOpenProfile}
          className="flex items-center gap-2 glass px-3 sm:px-4 py-2.5 rounded-lg hover:bg-accent-theme/10 transition-colors text-left min-h-[44px]"
        >
          {user.user_metadata?.picture ? (
            <img
              src={user.user_metadata.picture}
              alt={user.user_metadata.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent-theme/20 flex items-center justify-center">
              <User size={16} className="text-accent-theme" />
            </div>
          )}
          <span className="text-sm font-medium text-theme hidden sm:block truncate">
            {user.user_metadata?.name || user.email}
          </span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="glass px-3 sm:px-4 py-2.5 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors text-sm font-medium min-h-[44px]"
        >
          Logout
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={signInWithGoogle}
      className="flex items-center gap-2 glass px-3 sm:px-4 py-2.5 rounded-lg text-theme hover:bg-accent-theme/10 transition-colors min-h-[44px]"
      aria-label="Login with Google"
    >
      <LogIn size={20} className="shrink-0" />
      <span className="font-medium hidden sm:inline">Login with Google</span>
    </motion.button>
  );
};
