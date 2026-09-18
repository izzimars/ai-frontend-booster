import { Home, BookOpen, ClipboardCheck, Users, Shield, Calendar, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { clearAllAuthTokens } from '../../services/apiClient';

interface SidebarProps {
  role: string;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ role, currentView, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    proprietor: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'analytics', label: 'School Analytics', icon: Users },
    ],
    admin: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'settings', label: 'Settings', icon: Shield },
    ],
    teacher: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
      { id: 'questions', label: 'Questions', icon: ClipboardCheck },
    ],
    secretary: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'classes', label: 'Classes', icon: Users },
      { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
      { id: 'settings', label: 'Settings', icon: Shield },
    ],
  };

  const items = menuItems[role] || [];

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-sidebar border-r border-sidebar-border flex flex-col h-screen`}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!isCollapsed && <h2 className="text-sidebar-foreground">SMFA</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-sidebar-accent rounded-lg"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={async () => {
            try { await logout(); } catch { void 0; }
            clearAllAuthTokens();
            navigate('/auth/login', { replace: true });
          }}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
