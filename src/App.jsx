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
import StoneGamePage from '@/pages/StonGamePage';
import Navigation from '@/components/layout/Navigation';
import { Toaster } from '@/components/ui/toaster';
import { initializeAppData } from '@/data';
import { Loader2 } from 'lucide-react';

export const UserContext = React.createContext(null);

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
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
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Routes>
        <Route path="/" element={<DashboardPage activeView="home" />} />
        <Route path="/tasks" element={<DashboardPage activeView="tasks" />} />
        <Route path="/invite" element={<DashboardPage activeView="invite" />} />
        <Route path="/leaders" element={<DashboardPage activeView="leaders" />} />
        <Route path="/game" element={<StoneGamePage />} />
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
        const cachedTgWebAppData = sessionStorage.getItem("tgWebAppDataRaw");
        const urlTgWebAppData = new URLSearchParams(window.location.search).get("tgWebAppData");

        const tgDataToUse = urlTgWebAppData || cachedTgWebAppData;

        if (!tgDataToUse) {
          setError("User not found. Please open from the Telegram bot.");
          return;
        }

        if (urlTgWebAppData) {
          sessionStorage.setItem("tgWebAppDataRaw", urlTgWebAppData);
        }

        const userData = await initializeAppData(tgDataToUse);

        if (userData) {
          sessionStorage.setItem("cachedUser", JSON.stringify(userData));
          setCurrentUser(userData);
        } else {
          setError("Failed to load user data. Try again from Telegram.");
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
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 text-primary">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900 text-destructive p-4">
        <p className="text-center">{error || "User data could not be loaded."}</p>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
      <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
        <main className={`flex-grow ${isGameRoute ? '' : 'container mx-auto px-4 py-8'}`}>
          <AnimatePresence mode="wait">
            <AppContent
              isAdmin={isAdmin}
              adminVerified={adminVerified}
              setAdminVerified={setAdminVerified}
              handleAdminLogin={handleAdminLogin}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              handleLogout={handleLogout}
            />
          </AnimatePresence>
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
