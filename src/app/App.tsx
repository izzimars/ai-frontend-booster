import { ReactNode, useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import type { TeacherDashboardTab } from './components/dashboards/TeacherDashboard';
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
import { PrincipalSignUpPage } from './components/auth/PrincipalSignUpPage';
import { OtpVerificationPage } from './components/auth/OtpVerificationPage';
import { SignInPage } from './components/auth/SignInPage';
import { SchoolSelectionPage } from './components/auth/SchoolSelectionPage';
import { SchoolSetupWizardPage } from './components/auth/SchoolSetupWizardPage';
import { SelectLevelPage } from './components/auth/SelectLevelPage';
import { SelectedLevelProvider, useSelectedLevel } from './components/auth/LevelSelectionContext';
import { Toaster } from './components/ui/sonner';
import { ChevronDown } from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { decodeAuthTokenPayload, getStoredAuthToken, hasValidAuthToken } from '../api/client';

type SetupStage =
  | 'pending'
  | 'session_created'
  | 'term_created'
  | 'level_created'
  | 'class_created'
  | 'completed';

type AppRole = 'parent' | 'teacher' | 'principal' | 'bursar' | 'admin' | 'gate' | 'nurse';

const normalizeRoleValue = (value: string): AppRole | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (normalized === 'parent' || normalized === 'guardian') return 'parent';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'principal') return 'principal';
  if (normalized === 'bursar' || normalized === 'accountant') return 'bursar';
  if (normalized === 'admin' || normalized === 'administrator') return 'admin';
  if (normalized === 'gate' || normalized === 'gate_staff' || normalized === 'gatestaff') return 'gate';
  if (normalized === 'nurse' || normalized === 'school_nurse') return 'nurse';

  return null;
};

const getAppRoleFromTokenPayload = (payload: Record<string, unknown> | null): AppRole | null => {
  if (!payload) return null;

  const directCandidates = [
    payload.role,
    payload.userRole,
    payload.user_role,
    payload.staffRole,
    payload.staff_role,
    payload.accountType,
    payload.account_type,
    payload.userType,
    payload.user_type,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string') {
      const normalized = normalizeRoleValue(candidate);
      if (normalized) return normalized;
    }
  }

  const userObject = payload.user;
  if (typeof userObject === 'object' && userObject !== null) {
    const userRecord = userObject as Record<string, unknown>;
    const nestedCandidates = [userRecord.role, userRecord.userRole, userRecord.user_role, userRecord.type, userRecord.userType];

    for (const candidate of nestedCandidates) {
      if (typeof candidate === 'string') {
        const normalized = normalizeRoleValue(candidate);
        if (normalized) return normalized;
      }
    }
  }

  return null;
};

const normalizeSetupStage = (stage: string | null | undefined): SetupStage | null => {
  if (!stage) return null;

  switch (stage) {
    case 'pending':
    case 'session_created':
    case 'term_created':
    case 'level_created':
    case 'class_created':
    case 'completed':
      return stage;
    case 'levels_created':
      return 'level_created';
    case 'classes_created':
      return 'class_created';
    default:
      return null;
  }
};

const getOnboardingRoute = (stage: SetupStage) => {
  switch (stage) {
    case 'pending':
      return '/setup/session';
    case 'session_created':
      return '/setup/term';
    case 'term_created':
      return '/setup/levels';
    case 'level_created':
      return '/setup/classes';
    case 'class_created':
    case 'completed':
      return '/dashboard';
    default:
      return '/setup/session';
  }
};

const setupPathByRoute = (pathname: string): string | null => {
  if (pathname === '/setup/session' || pathname === '/auth/school-setup') return '/setup/session';
  if (pathname === '/setup/term' || pathname === '/auth/school-setup/term' || pathname === '/onboarding/terms') return '/setup/term';
  if (pathname === '/setup/levels') return '/setup/levels';
  if (pathname === '/setup/classes') return '/setup/classes';
  return null;
};

type OnboardingGuardProps = {
  children: ReactNode;
};

function OnboardingGuard({ children }: OnboardingGuardProps) {
  const location = useLocation();

  const token = getStoredAuthToken();
  const payload = token ? decodeAuthTokenPayload(token) : null;
  const payloadSetupStage =
    typeof payload?.setup_stage === 'string'
      ? payload.setup_stage
      : typeof payload?.setupStage === 'string'
        ? payload.setupStage
        : null;

  const storedSetupStage = localStorage.getItem('setup_stage');
  const setupStage = normalizeSetupStage(storedSetupStage) ?? normalizeSetupStage(payloadSetupStage);

  useEffect(() => {
    if (setupStage && storedSetupStage !== setupStage) {
      localStorage.setItem('setup_stage', setupStage);
    }
  }, [storedSetupStage, setupStage]);

  if (!hasValidAuthToken()) {
    return <Navigate to="/auth/login" replace />;
  }

  const currentSetupPath = setupPathByRoute(location.pathname);

  // If stage is not yet available, keep user on current setup path instead of forcing step 1.
  if (!setupStage) {
    return <>{children}</>;
  }

  const expectedPath = getOnboardingRoute(setupStage);
  const normalizedCurrentPath = currentSetupPath || location.pathname;

  if (normalizedCurrentPath !== expectedPath) {
    console.log(`Redirecting user because stage is ${setupStage} and current path is ${location.pathname}`);
    return <Navigate to={expectedPath} replace />;
  }

  return <>{children}</>;
}

function AppShell() {
  const location = useLocation();
  const { selectedLevel } = useSelectedLevel();
  const [isDark, setIsDark] = useState(false);
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    const token = getStoredAuthToken();
    const payload = token ? (decodeAuthTokenPayload(token) as Record<string, unknown> | null) : null;
    return getAppRoleFromTokenPayload(payload) ?? 'parent';
  });
  const [currentView, setCurrentView] = useState('overview');
  const [selectedChild, setSelectedChild] = useState('Sarah Johnson');

  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) return;

    const token = getStoredAuthToken();
    const payload = token ? (decodeAuthTokenPayload(token) as Record<string, unknown> | null) : null;
    const roleFromToken = getAppRoleFromTokenPayload(payload);

    if (roleFromToken) {
      setCurrentRole(roleFromToken);
    }
  }, [location.pathname]);

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

  const mapTeacherViewToTab = (view: string): TeacherDashboardTab => {
    switch (view) {
      case 'overview':
        return 'todays_classes';
      case 'syllabus':
        return 'syllabus';
      case 'questions':
        return 'lesson_notes';
      default:
        return 'todays_classes';
    }
  };

  const renderDashboard = () => {
    if (location.pathname === '/dashboard' && selectedLevel) {
      return <PrincipalDashboard />;
    }

    switch (currentRole) {
      case 'parent':
        return <ParentDashboard />;
      case 'teacher':
        return <TeacherDashboard activeTabOverride={mapTeacherViewToTab(currentView)} />;
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
  const isAuthRoute =
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname.startsWith('/setup') ||
    location.pathname.startsWith('/select-level');

  if (isAuthRoute) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<SignInPage />} />
          <Route path="/auth/login" element={<SignInPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/principal-sign-up" element={<PrincipalSignUpPage />} />
          <Route path="/auth/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/auth/school-setup" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/auth/school-setup/term" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/onboarding/terms" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/setup/session" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/setup/term" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/setup/levels" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/setup/classes" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/select-level" element={<SelectLevelPage />} />
          <Route path="/auth/select-level" element={<SchoolSelectionPage />} />
          <Route path="/auth/select-school" element={<SchoolSelectionPage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </>
    );
  }

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
          {selectedLevel && location.pathname === '/dashboard' && (
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {selectedLevel.levelName}
            </div>
          )}
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
            <Route path="/dashboard" element={renderDashboard()} />
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

export default function App() {
  return (
    <SelectedLevelProvider>
      <AppShell />
    </SelectedLevelProvider>
  );
}
