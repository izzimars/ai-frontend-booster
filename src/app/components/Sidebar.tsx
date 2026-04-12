import { Home, BookOpen, ClipboardCheck, DollarSign, Users, Shield, Heart, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  role: string;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ role, currentView, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    parent: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'performance', label: 'Performance', icon: ClipboardCheck },
      { id: 'medical', label: 'Medical', icon: Heart },
    ],
    teacher: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
      { id: 'questions', label: 'Questions', icon: ClipboardCheck },
    ],
    principal: [
      { id: 'overview', label: 'Overview', icon: Home },
      { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
      { id: 'analytics', label: 'Analytics', icon: Users },
      { id: 'activity', label: 'Activity Monitor', icon: Shield },
    ],
    bursar: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'payments', label: 'Payments', icon: DollarSign },
    ],
    admin: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'settings', label: 'Settings', icon: Shield },
    ],
    gate: [
      { id: 'overview', label: 'Pickup Verification', icon: Shield },
    ],
    nurse: [
      { id: 'overview', label: 'Dashboard', icon: Home },
      { id: 'medications', label: 'Medications', icon: Heart },
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
        <button className="w-full flex items-center gap-3 p-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
