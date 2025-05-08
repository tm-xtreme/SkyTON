import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; // Only Router needed now
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import Navigation from '@/components/layout/Navigation'; // Import Navigation
import { Toaster } from '@/components/ui/toaster';
import { initializeAppData } from '@/data'; // Import the initializer
import { Loader2 } from 'lucide-react'; // Loading indicator

// Context to hold user data
export const UserContext = React.createContext(null);

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('home'); // Default view
  const [adminVerified, setAdminVerified] = useState(false); // Track if admin password is verified
  const [adminPassword, setAdminPassword] = useState(''); // Admin password state

  useEffect(() => {
    const loadAppData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = await initializeAppData(); // Fetch or create user
        if (userData) {
          setCurrentUser(userData);
        } else {
          setError("Could not load user data. Please ensure you're accessing this via the Telegram bot.");
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('An error occurred while loading the application.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppData();
  }, []); // Run only once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 text-primary">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 text-destructive p-4">
        <p className="text-center">{error}</p>
      </div>
    );
  }

  // Only render routes if currentUser is successfully loaded
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 text-destructive p-4">
        <p className="text-center">User data could not be loaded. Please try again via the Telegram bot.</p>
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin === true; // Check admin status from loaded user data

  const handleAdminLogin = () => {
    if (adminPassword === process.env.VITE_ENV_ADMIN_CODE) {
      setAdminVerified(true);
      setError(null);
    } else {
      setError('Invalid admin password. Please try again.');
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
      case 'tasks':
      case 'invite':
      case 'leaders':
        return <DashboardPage activeView={activeView} />;
      case 'admin':
        if (isAdmin) {
          if (!adminVerified) {
            // Prompt admin to enter the password
            return (
              <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-gray-900 text-primary p-4">
                <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 mb-4 text-black dark:text-white"
                />
                <button
                  onClick={handleAdminLogin}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
                >
                  Login
                </button>
                {error && <p className="text-destructive mt-4">{error}</p>}
              </div>
            );
          }
          return <AdminPage />;
        }
        return <DashboardPage activeView={'home'} />; // Fallback to home if not admin
      default:
        return <DashboardPage activeView={'home'} />; // Default to home
    }
  };

  return (
    <UserContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      <Router>
        <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900 pb-16"> {/* Add padding-bottom for nav */}

          {/* Main Content Area with Animation */}
          <main className="flex-grow container mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView} // Key change triggers animation
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Navigation Bar */}
          <Navigation activeView={activeView} setActiveView={setActiveView} isAdmin={isAdmin} />
        </div>
        <Toaster />
      </Router>
    </UserContext.Provider>
  );
}

export default App;
