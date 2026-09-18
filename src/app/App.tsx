import { ReactNode, useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { TeacherDashboard } from './components/dashboards/TeacherDashboard';
import type { TeacherDashboardTab } from './components/dashboards/TeacherDashboard';
import { ProprietorDashboard } from './components/dashboards/ProprietorDashboard';
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
import { RegisterPage } from './components/auth/RegisterPage';
import { AccountHubPage } from './components/auth/AccountHubPage';
import { SetPasswordPage } from './components/auth/SetPasswordPage';
import { ResendActivationLinkPage } from './components/auth/ResendActivationLinkPage';
import { SchoolOnboardingPage, TeacherOnboardingPage } from './components/auth/SchoolOnboardingPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordOtpPage } from './components/auth/ResetPasswordOtpPage';
import { ChangePasswordPage } from './components/auth/ChangePasswordPage';
import { GuardianOnboardingPage } from './components/auth/GuardianOnboardingPage';
import { SignInPage } from './components/auth/SignInPage';
import { SchoolSetupWizardPage } from './components/auth/SchoolSetupWizardPage';
import { SelectLevelPage } from './components/auth/SelectLevelPage';
import { SelectedLevelProvider, useSelectedLevel } from './components/auth/LevelSelectionContext';
import { Toaster } from './components/ui/sonner';
import { ChevronDown } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { decodeAuthTokenPayload, getStoredAuthToken, hasValidAuthToken } from '../api/client';
import { generateSchoolToken } from '../services/auth';
import { getCurrentSchoolId, getSchoolToken, setCurrentLevelId, setCurrentSchoolId, syncApiTokensFromStorage } from '../services/apiClient';
import { type AppRole, type StaffRole } from './auth/permissions';
import { getOnboardingRoute, type SetupStage } from './auth/setupRoutes';

type StaffCategory = {
  name: string;
  uuid: string;
  categoryOrder?: number;
};

type StaffSchoolAssignment = {
  staff_id?: number;
  role?: string;
  school_id?: string;
  school_name?: string;
  school_status?: string;
  setup_stage?: string;
  categories?: StaffCategory[];
};

type LoginStudent = {
  id?: string;
  student_id?: string;
  uuid?: string;
  fullName?: string;
  name?: string;
  className?: string;
  class_name?: string;
};

type LoginDataShape = {
  token?: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  students?: LoginStudent[];
  schools?: StaffSchoolAssignment[];
};

type LoginResponseShape = {
  success?: boolean;
  data?: LoginDataShape;
};

const postLoginPayloadKey = 'post-login-response';
const selectedSchoolAssignmentKey = 'selected-school-assignment';
const selectedSchoolRoleKey = 'selected-school-role';
const selectedStudentKey = 'selected-student';

const normalizeRoleValue = (value: string): AppRole | null => {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (normalized === 'parent' || normalized === 'guardian') return 'guardian';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'proprietor' || normalized === 'principal') return 'proprietor';
  if (normalized === 'admin' || normalized === 'administrator') return 'admin';
  if (normalized === 'secretary') return 'secretary';
  if (normalized === 'bursar' || normalized === 'accountant') return 'bursar';
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

const getCategoryOrder = (category: StaffCategory) => {
  if (typeof category.categoryOrder === 'number') return category.categoryOrder;
  return Number.MAX_SAFE_INTEGER;
};

const sortCategories = (categories: StaffCategory[] = []) => [...categories].sort((a, b) => getCategoryOrder(a) - getCategoryOrder(b));

const normalizeSchoolSetupStage = (setupStage: unknown): SetupStage | null => {
  if (typeof setupStage !== 'string') return null;
  return normalizeSetupStage(setupStage);
};

const getStudentId = (student: LoginStudent) => student.id || student.student_id || student.uuid || '';

const getStudentDisplayName = (student: LoginStudent) => student.fullName || student.name || getStudentId(student) || 'Student';

const getStudentClassName = (student: LoginStudent) => student.className || student.class_name || 'N/A';

const getCompletedStaffSchools = (schools: StaffSchoolAssignment[] = []) =>
  schools.filter((school) => normalizeSchoolSetupStage(school.setup_stage) === 'completed');

export const getInitialRouteAfterLogin = (loginData: LoginDataShape): string => {
  const schools = Array.isArray(loginData.schools) ? loginData.schools : [];
  const students = Array.isArray(loginData.students) ? loginData.students : [];

  if (schools.length > 0) {
    const completedSchools = getCompletedStaffSchools(schools);

    if (!completedSchools.length) {
      const firstSchoolStage = normalizeSchoolSetupStage(schools[0]?.setup_stage) ?? 'pending';
      return getOnboardingRoute(firstSchoolStage);
    }

    if (completedSchools.length > 1) return '/select-school';

    const onlySchool = completedSchools[0];
    const categories = sortCategories(onlySchool.categories || []);
    if (categories.length > 1) {
      return `/select-category?schoolId=${encodeURIComponent(onlySchool.school_id || '')}`;
    }

    return '/dashboard';
  }

  if (students.length > 1) return '/select-student';
  if (students.length === 1) {
    const studentId = getStudentId(students[0]);
    if (studentId) {
      return `/guardian/${encodeURIComponent(studentId)}`;
    }
  }

  return '/auth/account-hub';
};

const setupPathByRoute = (pathname: string): string | null => {
  if (pathname === '/auth/setup/session') return '/auth/setup/session';
  if (pathname === '/auth/setup/term') return '/auth/setup/term';
  if (pathname === '/auth/setup/levels') return '/auth/setup/levels';
  if (pathname === '/auth/setup/classes') return '/auth/setup/classes';
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

function PostLoginRouterPage() {
  const navigate = useNavigate();
  const { setSelectedLevel, clearSelectedLevel } = useSelectedLevel();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const stored = localStorage.getItem(postLoginPayloadKey);
    if (!stored) {
      navigate('/auth/login', { replace: true });
      return;
    }

    let parsed: LoginResponseShape | null = null;
    try {
      parsed = JSON.parse(stored) as LoginResponseShape;
    } catch {
      localStorage.removeItem(postLoginPayloadKey);
      navigate('/auth/login', { replace: true });
      return;
    }

    const routeUser = async () => {
      const data = parsed?.data || {};
      const initialRoute = getInitialRouteAfterLogin(data);

      const allSchools = Array.isArray(data.schools) ? data.schools : [];
      const schools = getCompletedStaffSchools(allSchools);
      const students = Array.isArray(data.students) ? data.students : [];

      if (schools.length === 1) {
        const school = schools[0];
        localStorage.setItem(selectedSchoolAssignmentKey, JSON.stringify(school));
        if (typeof school.role === 'string') {
          localStorage.setItem(selectedSchoolRoleKey, school.role);
        }
        if (school.school_id) {
          setCurrentSchoolId(school.school_id);
          await generateSchoolToken(school.school_id);
        }

        const categories = sortCategories(school.categories || []);
        if (categories.length === 1 && categories[0].uuid) {
          setSelectedLevel({ levelUuid: categories[0].uuid, levelName: categories[0].name });
          setCurrentLevelId(categories[0].uuid);
        }
        if (categories.length === 0) {
          clearSelectedLevel();
        }
      } else if (schools.length === 0 && allSchools.length > 0) {
        const onboardingSchool = allSchools[0];
        if (onboardingSchool.school_id) {
          localStorage.setItem(selectedSchoolAssignmentKey, JSON.stringify(onboardingSchool));
          if (typeof onboardingSchool.role === 'string') {
            localStorage.setItem(selectedSchoolRoleKey, onboardingSchool.role);
          }
          setCurrentSchoolId(onboardingSchool.school_id);
          await generateSchoolToken(onboardingSchool.school_id);
        }
      }

      if (students.length === 1) {
        localStorage.setItem(selectedStudentKey, JSON.stringify(students[0]));
      }

      if (!isMounted) return;
      navigate(initialRoute, { replace: true });
    };

    routeUser().catch((err) => {
      if (!isMounted) return;
      setError(err instanceof Error ? err.message : 'Unable to initialize school session.');
    });

    return () => {
      isMounted = false;
    };
  }, [navigate, setSelectedLevel, clearSelectedLevel]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Preparing your workspace...</h1>
        <p className="mt-2 text-sm text-slate-600">Routing you based on your assigned schools, role, and categories.</p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}

function SchoolSelectionRoutePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedLevel, clearSelectedLevel } = useSelectedLevel();

  const [schools, setSchools] = useState<StaffSchoolAssignment[]>([]);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSelectedSchoolId = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(postLoginPayloadKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as LoginResponseShape;
      setSchools(getCompletedStaffSchools(Array.isArray(parsed.data?.schools) ? parsed.data?.schools : []));
    } catch {
      setSchools([]);
    }
  }, []);

  const handleSchoolSelect = async (school: StaffSchoolAssignment) => {
    setError(null);
    if (!school.school_id) {
      setError('Selected school is missing an ID.');
      return;
    }

    setIsGeneratingToken(true);

    localStorage.setItem(selectedSchoolAssignmentKey, JSON.stringify(school));
    if (typeof school.role === 'string') {
      localStorage.setItem(selectedSchoolRoleKey, school.role);
    }

    try {
      setCurrentSchoolId(school.school_id);
      await generateSchoolToken(school.school_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate school token.');
      setIsGeneratingToken(false);
      return;
    }

    const categories = sortCategories(school.categories || []);
    if (categories.length > 1) {
      setIsGeneratingToken(false);
      navigate(`/select-category?schoolId=${encodeURIComponent(school.school_id || '')}`);
      return;
    }

    if (categories.length === 1 && categories[0].uuid) {
      setSelectedLevel({ levelUuid: categories[0].uuid, levelName: categories[0].name });
      setCurrentLevelId(categories[0].uuid);
    } else {
      clearSelectedLevel();
    }

    setIsGeneratingToken(false);
    navigate('/dashboard');
  };

  useEffect(() => {
    const schoolId = new URLSearchParams(location.search).get('schoolId');
    if (!schoolId || !schools.length) return;
    if (autoSelectedSchoolId.current === schoolId) return;

    const requestedSchool = schools.find((school) => school.school_id === schoolId);
    if (requestedSchool) {
      autoSelectedSchoolId.current = schoolId;
      void handleSchoolSelect(requestedSchool);
    }
  }, [location.search, schools]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Select School</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a school assignment to continue.</p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {schools.map((school) => (
            <button
              key={`${school.school_id}-${school.role}`}
              type="button"
              onClick={() => handleSchoolSelect(school)}
              disabled={isGeneratingToken}
              className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
            >
              <p className="text-sm text-slate-500">{school.role || 'staff'}</p>
              <p className="mt-1 font-medium text-slate-900">{school.school_name || school.school_id || 'School'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentSelectionRoutePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [students, setStudents] = useState<LoginStudent[]>([]);
  const autoSelectedStudentId = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(postLoginPayloadKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as LoginResponseShape;
      setStudents(Array.isArray(parsed.data?.students) ? parsed.data?.students : []);
    } catch {
      setStudents([]);
    }
  }, []);

  const handleStudentSelect = (student: LoginStudent) => {
    const studentId = getStudentId(student);
    if (!studentId) return;

    localStorage.setItem(selectedStudentKey, JSON.stringify(student));
    navigate(`/guardian/${encodeURIComponent(studentId)}`);
  };

  useEffect(() => {
    const studentId = new URLSearchParams(location.search).get('studentId');
    if (!studentId || !students.length) return;
    if (autoSelectedStudentId.current === studentId) return;

    const requestedStudent = students.find((student) => getStudentId(student) === studentId);
    if (requestedStudent) {
      autoSelectedStudentId.current = studentId;
      handleStudentSelect(requestedStudent);
    }
  }, [location.search, students]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Select Student</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a student profile to continue to guardian dashboard.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {students.map((student) => {
            const studentId = getStudentId(student);
            return (
              <button
                key={studentId || getStudentDisplayName(student)}
                type="button"
                onClick={() => handleStudentSelect(student)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
              >
                <p className="font-medium text-slate-900">{getStudentDisplayName(student)}</p>
                <p className="mt-1 text-sm text-slate-500">{getStudentClassName(student)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CategorySelectionRoutePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedLevel } = useSelectedLevel();

  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const schoolId = searchParams.get('schoolId');

    const selectedSchoolRaw = localStorage.getItem(selectedSchoolAssignmentKey);
    const snapshotRaw = localStorage.getItem(postLoginPayloadKey);

    let school: StaffSchoolAssignment | null = null;

    if (selectedSchoolRaw) {
      try {
        const selectedSchool = JSON.parse(selectedSchoolRaw) as StaffSchoolAssignment;
        if (!schoolId || selectedSchool.school_id === schoolId) {
          school = selectedSchool;
        }
      } catch {
        school = null;
      }
    }

    if (!school && snapshotRaw) {
      try {
        const parsed = JSON.parse(snapshotRaw) as LoginResponseShape;
        const schools = getCompletedStaffSchools(Array.isArray(parsed.data?.schools) ? parsed.data?.schools : []);
        school = schools.find((entry) => entry.school_id === schoolId) || schools[0] || null;
      } catch {
        school = null;
      }
    }

    if (schoolId && !school) {
      setAccessDenied(true);
      return;
    }

    setAccessDenied(false);
    setCategories(sortCategories(school?.categories || []));
  }, [location.search]);

  const handleCategorySelect = (category: StaffCategory) => {
    setSelectedLevel({ levelUuid: category.uuid, levelName: category.name });
    setCurrentLevelId(category.uuid);
    navigate(`/dashboard?categoryUuid=${encodeURIComponent(category.uuid)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Select Category</h1>
        <p className="mt-2 text-sm text-slate-600">Choose which category/level context to open.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category.uuid}
              type="button"
              onClick={() => handleCategorySelect(category)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
            >
              <p className="text-sm text-slate-500">Level {category.categoryOrder ?? '-'}</p>
              <p className="mt-1 font-medium text-slate-900">{category.name}</p>
            </button>
          ))}
        </div>

        {accessDenied && (
          <p className="mt-4 text-sm text-flag-red">
            You don't have access to the requested school.
          </p>
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLevel } = useSelectedLevel();
  const [isDark, setIsDark] = useState(false);
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    const storedSchoolRole = localStorage.getItem(selectedSchoolRoleKey);
    if (typeof storedSchoolRole === 'string') {
      const normalizedStoredRole = normalizeRoleValue(storedSchoolRole);
      if (normalizedStoredRole) return normalizedStoredRole;
    }

    const token = getStoredAuthToken();
    const payload = token ? (decodeAuthTokenPayload(token) as Record<string, unknown> | null) : null;
    return getAppRoleFromTokenPayload(payload) ?? 'guardian';
  });
  const [currentView, setCurrentView] = useState('overview');
  const [selectedChild, setSelectedChild] = useState('Sarah Johnson');

  useEffect(() => {
    syncApiTokensFromStorage();
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) return;

    const currentSchoolId = getCurrentSchoolId();
    const schoolToken = getSchoolToken();

    if (!currentSchoolId || schoolToken) return;

    generateSchoolToken(currentSchoolId).catch(() => {
      navigate('/select-school', { replace: true });
    });
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!location.pathname.startsWith('/dashboard')) return;

    const storedSchoolRole = localStorage.getItem(selectedSchoolRoleKey);
    if (typeof storedSchoolRole === 'string') {
      const normalizedStoredRole = normalizeRoleValue(storedSchoolRole);
      if (normalizedStoredRole) {
        setCurrentRole(normalizedStoredRole);
        return;
      }
    }

    const token = getStoredAuthToken();
    const payload = token ? (decodeAuthTokenPayload(token) as Record<string, unknown> | null) : null;
    const roleFromToken = getAppRoleFromTokenPayload(payload);

    if (roleFromToken) {
      setCurrentRole(roleFromToken);
    }
  }, [location.pathname]);

  const roleData = {
    guardian: { name: 'Jane Johnson', notificationCount: 3 },
    teacher: { name: 'Mrs. Johnson', notificationCount: 5 },
    proprietor: { name: 'Mr. Brown', notificationCount: 8 },
    bursar: { name: 'Ms. Lee', notificationCount: 12 },
    admin: { name: 'Admin User', notificationCount: 2 },
    secretary: { name: 'Mrs. Stella Grant', notificationCount: 4 },
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
    switch (currentRole) {
       case 'guardian':
         return <ParentDashboard />;
       case 'teacher':
         return <TeacherDashboard activeTabOverride={mapTeacherViewToTab(currentView)} />;
       case 'proprietor':
         return <ProprietorDashboard />;
       case 'bursar':
         return <BursarDashboard />;
       case 'admin':
         return <AdminDashboard />;
       case 'secretary':
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
    location.pathname.startsWith('/auth/setup') ||
    location.pathname.startsWith('/select-level') ||
    location.pathname.startsWith('/select-school') ||
    location.pathname.startsWith('/select-student') ||
    location.pathname.startsWith('/select-category') ||
    location.pathname.startsWith('/post-login') ||
    location.pathname.startsWith('/auth/account-hub');

  if (isAuthRoute) {
    return (
      <>
        <Routes>
          <Route path="/auth" element={<SignInPage />} />
          <Route path="/auth/login" element={<SignInPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/set-password" element={<SetPasswordPage />} />
          <Route path="/auth/resend-activation" element={<ResendActivationLinkPage />} />
          <Route path="/auth/onboarding/school" element={<SchoolOnboardingPage />} />
          <Route path="/auth/onboarding/teacher" element={<TeacherOnboardingPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordOtpPage />} />
          <Route path="/auth/change-password" element={<ChangePasswordPage />} />
          <Route path="/auth/guardian-onboarding" element={<GuardianOnboardingPage />} />
          <Route path="/auth/setup/session" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/auth/setup/term" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/auth/setup/levels" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/auth/setup/classes" element={<OnboardingGuard><SchoolSetupWizardPage /></OnboardingGuard>} />
          <Route path="/post-login" element={<PostLoginRouterPage />} />
          <Route path="/select-school" element={<SchoolSelectionRoutePage />} />
          <Route path="/select-student" element={<StudentSelectionRoutePage />} />
          <Route path="/select-category" element={<CategorySelectionRoutePage />} />
          <Route path="/auth/account-hub" element={<AccountHubPage />} />
          <Route path="/no-access" element={<Navigate to="/auth/account-hub" replace />} />
          <Route path="/select-level" element={<SelectLevelPage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </>
    );
  }

  const storedSetupStage = localStorage.getItem('setup_stage');
  if (
    hasValidAuthToken() &&
    location.pathname === '/dashboard' &&
    storedSetupStage &&
    storedSetupStage !== 'completed'
  ) {
    const normalizedStage = normalizeSetupStage(storedSetupStage);
    if (normalizedStage && normalizedStage !== 'completed') {
      const setupRoute = getOnboardingRoute(normalizedStage);
      return <Navigate to={setupRoute} replace />;
    }
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
          {currentRole === 'guardian' && (
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
            <Route path="/guardian/:studentId" element={<ParentDashboard />} />
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
            <option value="proprietor">Proprietor</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="secretary">Secretary</option>
            <option value="bursar" disabled>Bursar/Accountant (out of MVP scope)</option>
            <option value="guardian" disabled>Guardian (out of MVP scope)</option>
            <option value="gate" disabled>Gate Staff (scaffolding)</option>
            <option value="nurse" disabled>School Nurse (scaffolding)</option>
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
