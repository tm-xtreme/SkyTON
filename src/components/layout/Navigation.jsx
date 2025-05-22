import React from 'react';
import { Home, ListChecks, Users, Trophy, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Navigation = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: ListChecks },
    { path: '/invite', label: 'Invite', icon: Users },
    { path: '/leaders', label: 'Leaders', icon: Trophy },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/60 border-t border-white/10 rounded-t-xl">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-16 text-xs",
                isActive
                  ? "text-primary drop-shadow-md"
                  : "text-muted-foreground hover:text-white transition"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive && "text-primary animate-pulse"
                )}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
