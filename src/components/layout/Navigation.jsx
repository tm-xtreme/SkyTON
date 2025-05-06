
import React from 'react';
import { Home, ListChecks, Users, Trophy, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = ({ activeView, setActiveView, isAdmin }) => {
  const navItems = [
    { name: 'home', label: 'Home', icon: Home },
    { name: 'tasks', label: 'Tasks', icon: ListChecks },
    { name: 'invite', label: 'Invite', icon: Users },
    { name: 'leaders', label: 'Leaders', icon: Trophy },
    ...(isAdmin ? [{ name: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-md mx-auto px-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveView(item.name)}
            className={cn(
              "flex flex-col items-center justify-center text-xs w-16 h-full transition-colors duration-200 ease-in-out",
              activeView === item.name
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
  