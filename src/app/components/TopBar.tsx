import { Bell, User, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  role: string;
  userName: string;
  notificationCount?: number;
  onThemeToggle?: () => void;
  isDark?: boolean;
  children?: React.ReactNode;
}

export function TopBar({ role, userName, notificationCount = 0, onThemeToggle, isDark = false, children }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="capitalize">{role} Portal</h1>
        {children}
      </div>

      <div className="flex items-center gap-4">
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className="p-2 hover:bg-accent rounded-lg"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}

        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-accent rounded-lg"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          )}
        </button>

        <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User size={16} className="text-primary-foreground" />
          </div>
          <span>{userName}</span>
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
