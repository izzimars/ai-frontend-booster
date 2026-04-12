import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import { PrincipalDashboard } from './components/dashboards/PrincipalDashboard';
import { BursarDashboard } from './components/dashboards/BursarDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { GateDashboard } from './components/dashboards/GateDashboard';
import { NurseDashboard } from './components/dashboards/NurseDashboard';
import { ClassOverviewPage } from './components/dashboards/ClassOverviewPage';
import { ClassDetailView } from './components/dashboards/ClassDetailView';
import { ClassStudentProfileView } from './components/dashboards/ClassStudentProfileView';
import { ClassSubjectAnalysisView } from './components/dashboards/ClassSubjectAnalysisView';
import { ClassCommandCenterPage } from './components/dashboards/ClassCommandCenterPage';
import { SubjectDetailPage } from './components/dashboards/SubjectDetailPage';
import { TeachingConsolePage } from './components/dashboards/TeachingConsolePage';
import { StudentDetailPage } from './components/dashboards/StudentDetailPage';
import { AssessmentManagerPage } from './components/dashboards/AssessmentManagerPage';
import { LessonEditorPage } from './components/dashboards/LessonEditorPage';
import { Toaster } from './components/ui/sonner';
import { ChevronDown } from 'lucide-react';
import { Route, Routes, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [currentRole, setCurrentRole] = useState<'parent' | 'teacher' | 'principal' | 'bursar' | 'admin' | 'gate' | 'nurse'>('parent');
  const [currentView, setCurrentView] = useState('overview');
  const [selectedChild, setSelectedChild] = useState('Sarah Johnson');

  const roleData = {
    parent: { name: 'Jane Johnson', notificationCount: 3 },
    teacher: { name: 'Mrs. Johnson', notificationCount: 5 },
    principal: { name: 'Mr. Brown', notificationCount: 8 },
    bursar: { name: 'Ms. Lee', notificationCount: 12 },
    admin: { name: 'Admin User', notificationCount: 2 },
    gate: { name: 'Gate Staff 1', notificationCount: 0 },
    nurse: { name: 'Nurse Williams', notificationCount: 4 },
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'parent':
        return <ParentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'principal':
        return <PrincipalDashboard />;
      case 'bursar':
        return <BursarDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'gate':
        return <GateDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      default:
        return <ParentDashboard />;
    }
  };

  const isTeachingConsoleRoute = location.pathname.startsWith('/teaching-console/');

  if (isTeachingConsoleRoute) {
    return (
      <div className={`h-screen ${isDark ? 'dark' : ''}`}>
        <div className="h-full overflow-y-auto bg-background">
          <Routes>
            <Route path="/teaching-console/:classId" element={<TeachingConsolePage />} />
            <Route path="/teaching-console/lesson-editor/:noteId" element={<LessonEditorPage />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'dark' : ''}`}>
      <Sidebar role={currentRole} currentView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          role={currentRole}
          userName={roleData[currentRole].name}
          notificationCount={roleData[currentRole].notificationCount}
          onThemeToggle={toggleTheme}
          isDark={isDark}
        >
          {currentRole === 'parent' && (
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80">
                <span>{selectedChild}</span>
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </TopBar>

        <div className="flex-1 overflow-y-auto bg-background">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/admin/classes/:classId" element={<ClassDetailView />} />
            <Route path="/admin/classes/:classId/students/:studentId" element={<ClassStudentProfileView />} />
            <Route path="/admin/classes/:classId/students/:studentId/subjects/:subjectId" element={<ClassSubjectAnalysisView />} />
            <Route path="/class/:classId" element={<ClassOverviewPage />} />
            <Route path="/teacher/class-command-center" element={<ClassCommandCenterPage />} />
            <Route path="/teacher/class-command-center/:classId" element={<ClassCommandCenterPage />} />
            <Route path="/teacher/student-detail/:studentId" element={<StudentDetailPage />} />
            <Route path="/class/:classId/subject/:subjectId" element={<SubjectDetailPage />} />
            <Route path="/assessment/:assessmentId" element={<AssessmentManagerPage />} />
            <Route path="/teaching-console/:classId" element={<TeachingConsolePage />} />
          </Routes>
        </div>
      </div>

      {/* Role Switcher (for demo purposes) */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <p className="text-muted-foreground mb-2">Demo: Switch Role</p>
          <select
            value={currentRole}
            onChange={(e) => {
              setCurrentRole(e.target.value as any);
              setCurrentView('overview');
            }}
            className="w-full p-2 border border-border rounded-lg bg-input-background"
          >
            <option value="parent">Parent/Guardian</option>
            <option value="teacher">Teacher</option>
            <option value="principal">Principal</option>
            <option value="bursar">Bursar/Accountant</option>
            <option value="admin">Admin</option>
            <option value="gate">Gate Staff</option>
            <option value="nurse">School Nurse</option>
          </select>
        </div>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
