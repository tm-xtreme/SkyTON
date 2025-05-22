import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import StonDropGame from '@/pages/StonDropGame';
import Navigation from '@/components/layout/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { initializeAppData } from '@/data';
import { Loader2 } from 'lucide-react';

export const UserContext = React.createContext(null);

// Page transition animations
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25
};

function AppContent({
  isAdmin,
  adminVerified,
  setAdminVerified,
  handleAdminLogin,
  adminPassword,
  setAdminPassword,
  handleLogout
}) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="min-h-[100dvh] bg-[#0f0f0f] text-white"
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardPage activeView="home" />} />
          <Route path="/tasks" element={<DashboardPage activeView="tasks" />} />
          <Route path="/invite" element={<DashboardPage activeView="invite" />} />
          <Route path="/leaders" element={<DashboardPage activeView="leaders" />} />
          <Route path="/game" element={<StonDropGame />} />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                adminVerified || sessionStorage.getItem("adminSession") === "true" ? (
                  <>
                    <AdminPage />
                    <div className="text-center py-2">
                      <button onClick={handleLogout} className="text-sm text-red-500">
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900 overflow-y-auto text-primary p-4">
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
                  </div>
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminVerified, setAdminVerified] = useState(() => localStorage.getItem("adminVerified") === "true");
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const cachedUser = sessionStorage.getItem("cachedUser");
        if (cachedUser) {
          setCurrentUser(JSON.parse(cachedUser));
        }

        const userData = await initializeAppData();
        if (userData) {
          sessionStorage.setItem("cachedUser", JSON.stringify(userData));
          setCurrentUser(userData);
        } else {
          setError("User not found. Please open from the Telegram bot.");
        }
      } catch (err) {
        console.error("App init error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleAdminLogin = async () => {
    try {
      const res = await fetch("/api/verifyAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        setAdminVerified(true);
        localStorage.setItem("adminVerified", "true");
        sessionStorage.setItem("adminSession", "true");
        setError(null);
      } else {
        setError(data.message || "Invalid admin password.");
      }
    } catch (err) {
      setError("Admin login failed.");
    }
  };

  const handleLogout = () => {
    setAdminVerified(false);
    localStorage.removeItem("adminVerified");
    sessionStorage.removeItem("adminSession");
    sessionStorage.removeItem("cachedUser");
    sessionStorage.removeItem("tgWebAppDataRaw");
  };

  const isGameRoute = location.pathname === "/game";
  const isAdmin = currentUser?.isAdmin === true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-white">
        <Loader2 className="h-12 w-12 animate-spin text-sky-400" />
        <p className="text-sm text-muted-foreground ml-3">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-red-500 p-4">
        <p className="text-center">{error || "User data could not be loaded."}</p>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-white">
        <main className="flex-grow overflow-x-hidden">
          <AppContent
            isAdmin={isAdmin}
            adminVerified={adminVerified}
            setAdminVerified={setAdminVerified}
            handleAdminLogin={handleAdminLogin}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            handleLogout={handleLogout}
          />
        </main>
        {!isGameRoute && <Navigation isAdmin={isAdmin} />}
        <Toaster />
      </div>
    </UserContext.Provider>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
