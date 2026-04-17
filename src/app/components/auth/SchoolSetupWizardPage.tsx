import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { AuthErrorAlert } from './AuthErrorAlert';
import { Stepper, type SetupStage, mapSetupStageToStepIndex } from './Stepper';
import { apiClient, decodeAuthTokenPayload, getStoredAuthToken, hasValidAuthToken } from '../../../api/client';

type WizardStep = 0 | 1 | 2 | 3 | 4;

type LevelOption = {
  name: string;
  order: number;
};

type ClassDraft = {
  id: number;
  name: string;
  classOrder: number;
};

type CreatedLevel = {
  id: string;
  name: string;
  order: number;
};

type LevelsApiItem = {
  id?: string;
  uuid?: string;
  levelUuid?: string;
  name?: string;
  category_order?: number;
  order?: number;
  levelOrder?: number;
};

type SessionApiItem = {
  session_id: string;
  session_name: string;
  session_start_date: string;
  session_end_date: string;
};

type SessionOption = {
  sessionId: string;
  sessionName: string;
  sessionStartDate: string;
  sessionEndDate: string;
};

const authTokenKey = 'authToken';
const setupStageKey = 'setup_stage';
const sessionNamePattern = /^\d{4}\/\d{4}$/;
const termNameOptions = ['First Term', 'Second Term', 'Third Term'];

const levelOptions: LevelOption[] = [
  { name: 'Creche', order: 0 },
  { name: 'Nursery', order: 1 },
  { name: 'Kindergarten', order: 2 },
  { name: 'Primary', order: 3 },
  { name: 'Junior Secondary', order: 4 },
  { name: 'Senior Secondary', order: 5 },
];

type ApiErrorShape = {
  message?: string;
};

type DelegateInviteForm = {
  email: string;
  role: 'admin';
  phoneNumber: string;
  firstName: string;
  lastName: string;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiErrorShape>;
  return axiosError.response?.data?.message || axiosError.message || fallback;
};

const getCurrentAcademicSessionName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const startYear = monthIndex >= 7 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
};

type SessionSelectorProps = {
  options: SessionOption[];
  selectedSessionId: string;
  isLoading: boolean;
  onChange: (sessionId: string) => void;
};

const getStepFromSetupStage = (setupStage: string | null): WizardStep => {
  switch (setupStage) {
    case 'pending':
      return 1;
    case 'session_created':
      return 2;
    case 'term_created':
      return 3;
    case 'level_created':
    case 'levels_created':
    case 'class_created':
    case 'classes_created':
    case 'completed':
      return 4;
    default:
      return 1;
  }
};

const getStepFourStageValue = (setupStage: string | null | undefined) => {
  if (!setupStage) return 'levels_created';

  switch (setupStage) {
    case 'level_created':
    case 'levels_created':
    case 'class_created':
    case 'classes_created':
      return setupStage;
    default:
      return 'levels_created';
  }
};

const getPathForStep = (step: WizardStep): string => {
  switch (step) {
    case 1:
      return '/setup/session';
    case 2:
      return '/setup/term';
    case 3:
      return '/setup/levels';
    case 4:
      return '/setup/classes';
    default:
      return '/setup/session';
  }
};

function SessionSelector({ options, selectedSessionId, isLoading, onChange }: SessionSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-800" htmlFor="term-session-id">Academic Session</label>
      <select
        id="term-session-id"
        required
        value={selectedSessionId}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || !options.length}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">{isLoading ? 'Loading sessions...' : 'Select academic session'}</option>
        {options.map((session) => (
          <option key={session.sessionId} value={session.sessionId}>{session.sessionName}</option>
        ))}
      </select>
      {!isLoading && !options.length ? (
        <p className="text-xs text-slate-500">No session found yet. Create a session in Step 1 first.</p>
      ) : null}
    </div>
  );
}

export function SchoolSetupWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState<WizardStep>(() => getStepFromSetupStage(localStorage.getItem(setupStageKey)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToTerm, setIsRedirectingToTerm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tokenSchoolDisplay, setTokenSchoolDisplay] = useState<string>('');

  const [delegateForm, setDelegateForm] = useState<DelegateInviteForm>({
    email: '',
    role: 'admin',
    phoneNumber: '',
    firstName: '',
    lastName: '',
  });
  const [delegateInviteRecipient, setDelegateInviteRecipient] = useState<string | null>(null);

  const [sessionName, setSessionName] = useState('');
  const [sessionStartDate, setSessionStartDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');
  const [termSessionId, setTermSessionId] = useState('');
  const [sessionOptions, setSessionOptions] = useState<SessionOption[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [termName, setTermName] = useState(termNameOptions[0]);
  const [termStartDate, setTermStartDate] = useState('');
  const [termEndDate, setTermEndDate] = useState('');
  const [termNumber, setTermNumber] = useState(1);

  const [selectedLevelOrders, setSelectedLevelOrders] = useState<number[]>([]);

  const [createdLevels, setCreatedLevels] = useState<CreatedLevel[]>([]);
  const [isLoadingCreatedLevels, setIsLoadingCreatedLevels] = useState(false);
  const [selectedClassLevelId, setSelectedClassLevelId] = useState<string>('');
  const [classDraftsByLevel, setClassDraftsByLevel] = useState<Record<string, ClassDraft[]>>({});

  const setupStage: SetupStage =
    currentStep <= 1
      ? 'pending'
      : currentStep === 2
        ? 'session_created'
        : currentStep === 3
          ? 'term_created'
          : currentStep === 4
            ? 'levels_created'
            : 'classes_created';

  const selectedLevels = useMemo(
    () => levelOptions.filter((option) => selectedLevelOrders.includes(option.order)).sort((a, b) => a.order - b.order),
    [selectedLevelOrders],
  );

  const selectedTermSession = useMemo(
    () => sessionOptions.find((session) => session.sessionId === termSessionId) || null,
    [sessionOptions, termSessionId],
  );

  const selectedClassLevel = useMemo(
    () => createdLevels.find((level) => level.id === selectedClassLevelId) || null,
    [createdLevels, selectedClassLevelId],
  );

  const selectedClassDrafts = useMemo(
    () => (selectedClassLevelId ? classDraftsByLevel[selectedClassLevelId] || [] : []),
    [classDraftsByLevel, selectedClassLevelId],
  );

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
    setIsRedirectingToTerm(false);
  };

  const validateDelegateInviteForm = (form: DelegateInviteForm) => {
    const email = form.email.trim();
    const phoneNumber = form.phoneNumber.trim();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9+]{10,15}$/;

    if (!emailPattern.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (email !== email.toLowerCase()) {
      return 'Email must be lowercase.';
    }
    if (form.role !== 'admin') {
      return 'Role must be preset to admin.';
    }
    if (!phonePattern.test(phoneNumber)) {
      return 'Phone number must match /^[0-9+]{10,15}$/.';
    }
    if (firstName.length < 2 || firstName.length > 50) {
      return 'First name must be between 2 and 50 characters.';
    }
    if (lastName.length < 2 || lastName.length > 50) {
      return 'Last name must be between 2 and 50 characters.';
    }

    return null;
  };

  const updateDelegateForm = <K extends keyof DelegateInviteForm>(key: K, value: DelegateInviteForm[K]) => {
    clearMessages();
    setDelegateInviteRecipient(null);
    setDelegateForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!hasValidAuthToken()) {
      localStorage.removeItem(authTokenKey);
      navigate('/auth/login', { replace: true });
      return;
    }

    const token = getStoredAuthToken();
    if (!token) return;

    const payload = decodeAuthTokenPayload(token);
    const schoolName = payload?.schoolName || payload?.school_name;
    const schoolId = payload?.schoolId || payload?.school_id;
    if (typeof schoolName === 'string' && schoolName.trim()) {
      setTokenSchoolDisplay(schoolName);
    } else if (typeof schoolId === 'string' && schoolId.trim()) {
      setTokenSchoolDisplay(`School ${schoolId}`);
    }
  }, [navigate]);

  useEffect(() => {
    const targetPath = getPathForStep(currentStep);
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [currentStep, location.pathname, navigate]);

  useEffect(() => {
    const shouldLoadSessions = currentStep === 2 || location.pathname.endsWith('/term') || location.pathname.endsWith('/terms');
    if (!shouldLoadSessions) return;

    let isMounted = true;

    const loadSessions = async () => {
      setIsLoadingSessions(true);

      try {
        const response = await apiClient.get('/school/sessions');
        const rawItems: SessionApiItem[] = Array.isArray(response.data?.data) ? response.data.data : [];

        const normalized = rawItems.map((item) => ({
          sessionId: item.session_id,
          sessionName: item.session_name,
          sessionStartDate: item.session_start_date,
          sessionEndDate: item.session_end_date,
        }));

        if (!isMounted) return;

        setSessionOptions(normalized);

        const currentAcademicSessionName = getCurrentAcademicSessionName();
        const currentAcademicSession = normalized.find((session) => session.sessionName === currentAcademicSessionName);

        if (currentAcademicSession) {
          setTermSessionId(currentAcademicSession.sessionId);
        } else if (normalized.length === 1) {
          setTermSessionId(normalized[0].sessionId);
        } else if (termSessionId && !normalized.some((session) => session.sessionId === termSessionId)) {
          setTermSessionId('');
        }
      } catch {
        if (!isMounted) return;
        setSessionOptions([]);
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [currentStep, location.pathname, termSessionId]);

  useEffect(() => {
    if (currentStep !== 4) return;

    let isMounted = true;

    const loadCreatedLevels = async () => {
      setIsLoadingCreatedLevels(true);

      try {
        const response = await apiClient.get('/school/levels');
        const rawItems: LevelsApiItem[] = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        const normalized = rawItems
          .map((item) => {
            const id = item.uuid ?? item.levelUuid ?? item.id;
            const order = item.category_order ?? item.order ?? item.levelOrder;
            if (!id || typeof order !== 'number') return null;

            return {
              id,
              name: item.name || `Level ${order}`,
              order,
            } as CreatedLevel;
          })
          .filter((item): item is CreatedLevel => item !== null)
          .sort((a, b) => a.order - b.order);

        if (!isMounted) return;

        setCreatedLevels(normalized);
      } catch {
        if (!isMounted) return;
        setCreatedLevels([]);
      } finally {
        if (isMounted) {
          setIsLoadingCreatedLevels(false);
        }
      }
    };

    loadCreatedLevels();

    return () => {
      isMounted = false;
    };
  }, [currentStep]);

  const handleInviteAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    const validationError = validateDelegateInviteForm(delegateForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/school/delegate-setup', {
        email: delegateForm.email.trim(),
        role: 'admin',
        phoneNumber: delegateForm.phoneNumber.trim(),
        firstName: delegateForm.firstName.trim(),
        lastName: delegateForm.lastName.trim(),
      });

      const recipientName = `${delegateForm.firstName.trim()} ${delegateForm.lastName.trim()}`.trim();
      setDelegateInviteRecipient(recipientName || delegateForm.email.trim());
      setSuccessMessage(
        `Invitation sent! We've emailed ${recipientName || delegateForm.email.trim()} instructions to complete the setup.`,
      );
    } catch (error: unknown) {
      setError(extractErrorMessage(error, 'Failed to delegate setup.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!sessionNamePattern.test(sessionName.trim())) {
      setError('Session name must match YYYY/YYYY, for example 2026/2027.');
      return;
    }
    if (!sessionStartDate || !sessionEndDate) {
      setError('Please provide both start and end dates for the academic session.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/school/sessions', {
        name: sessionName.trim(),
        startDate: sessionStartDate,
        endDate: sessionEndDate,
      });

      const isSuccess = response.data?.success === true || response.status === 200 || response.status === 201;
      if (!isSuccess) {
        throw new Error('Session creation request did not return success=true.');
      }

      localStorage.setItem(setupStageKey, 'session_created');

      setSuccessMessage('Session created successfully. Redirecting to term setup...');
      setIsRedirectingToTerm(true);
      setCurrentStep(2);
      navigate('/onboarding/terms', { replace: true });
    } catch (error: unknown) {
      setError(extractErrorMessage(error, 'Unable to create academic session.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTerm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!termSessionId) {
      setError('Please select an academic session for this term.');
      return;
    }
    if (!termStartDate || !termEndDate) {
      setError('Please provide both start and end dates for the term.');
      return;
    }
    if (termStartDate > termEndDate) {
      setError('Term start date cannot be after term end date.');
      return;
    }
    if (selectedTermSession) {
      if (termStartDate < selectedTermSession.sessionStartDate || termStartDate > selectedTermSession.sessionEndDate) {
        setError('Term start date must be within the selected academic session date range.');
        return;
      }
      if (termEndDate < selectedTermSession.sessionStartDate || termEndDate > selectedTermSession.sessionEndDate) {
        setError('Term end date must be within the selected academic session date range.');
        return;
      }
    }
    if (!termNumber || termNumber < 1) {
      setError('Term number must be 1 or greater.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/school/terms', {
        name: termName,
        startDate: termStartDate,
        endDate: termEndDate,
        termNumber,
        session_id: termSessionId,
        isCurrent: true,
      });

      localStorage.setItem(setupStageKey, 'term_created');
      setCurrentStep(3);
      navigate('/setup/levels', { replace: true });
    } catch (error: unknown) {
      setError(extractErrorMessage(error, 'Unable to create term configuration.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLevelSelection = (order: number) => {
    clearMessages();
    setSelectedLevelOrders((prev) => {
      if (prev.includes(order)) {
        return prev.filter((item) => item !== order);
      }

      return [...prev, order].sort((a, b) => a - b);
    });
  };

  const handleCreateLevels = async () => {
    clearMessages();

    if (!selectedLevels.length) {
      setError('Select at least one school level before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/school/levels', {
        levels: selectedLevels.map((level) => ({
          name: level.name,
          categoryOrder: level.order,
        })),
      });

      const responseStage =
        response.data?.setup_stage ??
        response.data?.setupStage ??
        response.data?.data?.setup_stage ??
        response.data?.data?.setupStage ??
        response.data?.data?.schools?.[0]?.setup_stage ??
        response.data?.data?.schools?.[0]?.setupStage;

      localStorage.setItem(setupStageKey, getStepFourStageValue(responseStage));

      setClassDraftsByLevel({});
      setCreatedLevels([]);
      setSelectedClassLevelId('');
      setCurrentStep(4);
      navigate('/setup/classes', { replace: true });
    } catch (error: unknown) {
      setError(extractErrorMessage(error, 'Unable to create selected school levels.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addClassDraft = () => {
    clearMessages();
    if (!selectedClassLevelId) {
      setError('Select a level tab before adding classes.');
      return;
    }

    setClassDraftsByLevel((prev) => {
      const levelDrafts = prev[selectedClassLevelId] || [];
      const nextClassOrder = levelDrafts.length ? Math.max(...levelDrafts.map((draft) => draft.classOrder)) + 1 : 1;

      return {
        ...prev,
        [selectedClassLevelId]: [
          ...levelDrafts,
          { id: Date.now(), name: '', classOrder: nextClassOrder },
        ],
      };
    });
  };

  const removeClassDraft = (id: number) => {
    clearMessages();
    if (!selectedClassLevelId) return;

    setClassDraftsByLevel((prev) => {
      const levelDrafts = (prev[selectedClassLevelId] || []).filter((draft) => draft.id !== id);
      const resequenced = levelDrafts
        .sort((a, b) => a.classOrder - b.classOrder)
        .map((draft, index) => ({ ...draft, classOrder: index + 1 }));

      return {
        ...prev,
        [selectedClassLevelId]: resequenced,
      };
    });
  };

  const updateClassDraft = (id: number, patch: Partial<ClassDraft>) => {
    clearMessages();
    if (!selectedClassLevelId) return;

    setClassDraftsByLevel((prev) => ({
      ...prev,
      [selectedClassLevelId]: (prev[selectedClassLevelId] || []).map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    }));
  };

  const switchClassLevel = (levelId: string) => {
    clearMessages();
    setSelectedClassLevelId(levelId);
  };

  const handleCreateClasses = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearMessages();

    if (!selectedClassLevelId) {
      setError('Select a level tab before saving classes.');
      return;
    }

    const draftsForLevel = classDraftsByLevel[selectedClassLevelId] || [];

    if (!draftsForLevel.length) {
      setError('Add at least one class before finishing setup.');
      return;
    }
    if (draftsForLevel.some((draft) => !draft.name.trim())) {
      setError('Every class requires a name.');
      return;
    }

    const invalidClassOrder = draftsForLevel.some((draft) => !Number.isInteger(draft.classOrder) || draft.classOrder < 1);
    if (invalidClassOrder) {
      setError('Class order must be a whole number greater than 0.');
      return;
    }

    const classOrders = draftsForLevel.map((draft) => draft.classOrder);
    if (new Set(classOrders).size !== classOrders.length) {
      setError('Class order values must be unique within the selected level.');
      return;
    }

    setIsSubmitting(true);
    try {
      const classesPayload = draftsForLevel
        .sort((a, b) => a.classOrder - b.classOrder)
        .map((draft) => ({
          name: draft.name.trim(),
          levelId: selectedClassLevelId,
          order: draft.classOrder,
        }));

      await apiClient.post('/school/classes', classesPayload);

      localStorage.setItem(setupStageKey, 'classes_created');

      let resolvedLevels = createdLevels;

      if (!resolvedLevels.length) {
        const levelsResponse = await apiClient.get('/school/levels');
        const rawItems: LevelsApiItem[] = Array.isArray(levelsResponse.data)
          ? levelsResponse.data
          : Array.isArray(levelsResponse.data?.data)
            ? levelsResponse.data.data
            : [];

        resolvedLevels = rawItems
          .map((item) => {
            const id = item.uuid ?? item.levelUuid ?? item.id;
            const order = item.category_order ?? item.order ?? item.levelOrder;
            if (!id || typeof order !== 'number') return null;

            return {
              id,
              name: item.name || `Level ${order}`,
              order,
            } as CreatedLevel;
          })
          .filter((item): item is CreatedLevel => item !== null)
          .sort((a, b) => a.order - b.order);
      }

      if (resolvedLevels.length === 1) {
        navigate('/dashboard');
        return;
      }

      if (resolvedLevels.length > 1) {
        navigate('/select-level', { state: { levels: resolvedLevels } });
        return;
      } 

      navigate('/dashboard');
    } catch (error: unknown) {
      setError(extractErrorMessage(error, 'Unable to create classes.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="School Setup Wizard"
      subtitle="Configure your school structure before entering the operational workspace."
      footer={<p>Setup is sequential. Complete each step successfully before moving forward.</p>}
    >
      <div className="space-y-6">
        {currentStep > 0 ? <Stepper activeStep={mapSetupStageToStepIndex(setupStage)} /> : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        ) : null}
        {error ? <AuthErrorAlert message={error} /> : null}

        {currentStep === 0 ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Step 0: Setup Choice</h3>

            {delegateInviteRecipient ? (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Success</p>
                <p className="text-sm text-emerald-700">
                  Invitation sent! We've emailed {delegateInviteRecipient} instructions to complete the setup.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleInviteAdmin}>
                <p className="text-sm font-medium text-slate-800">Invite an Admin to Setup</p>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="delegate-email">Email</label>
                  <input
                    id="delegate-email"
                    type="email"
                    required
                    value={delegateForm.email}
                    onChange={(event) => updateDelegateForm('email', event.target.value.toLowerCase())}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="admin@school.edu"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="delegate-role">Role</label>
                  <input
                    id="delegate-role"
                    type="text"
                    value="admin"
                    readOnly
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="delegate-first-name">First Name</label>
                    <input
                      id="delegate-first-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={50}
                      value={delegateForm.firstName}
                      onChange={(event) => updateDelegateForm('firstName', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Jane"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="delegate-last-name">Last Name</label>
                    <input
                      id="delegate-last-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={50}
                      value={delegateForm.lastName}
                      onChange={(event) => updateDelegateForm('lastName', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="delegate-phone-number">Phone Number</label>
                  <input
                    id="delegate-phone-number"
                    type="tel"
                    required
                    value={delegateForm.phoneNumber}
                    onChange={(event) => updateDelegateForm('phoneNumber', event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="+2348012345678"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending Invite...' : 'Send Setup Invite'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setCurrentStep(1);
              }}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proceed with Manual Setup
            </button>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <form className="space-y-4" onSubmit={handleCreateSession}>
            <h3 className="text-base font-semibold text-slate-900">Step 1: Academic Session</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="session-name">Session Name</label>
              <input
                id="session-name"
                type="text"
                required
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                pattern="\d{4}/\d{4}"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="2026/2027"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="session-start-date">Start Date</label>
                <input
                  id="session-start-date"
                  type="date"
                  required
                  value={sessionStartDate}
                  onChange={(event) => setSessionStartDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="session-end-date">End Date</label>
                <input
                  id="session-end-date"
                  type="date"
                  required
                  value={sessionEndDate}
                  onChange={(event) => setSessionEndDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isRedirectingToTerm}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRedirectingToTerm ? 'Redirecting...' : isSubmitting ? 'Saving Session...' : 'Save Session and Continue'}
            </button>
          </form>
        ) : null}

        {currentStep === 2 ? (
          <form className="space-y-4" onSubmit={handleCreateTerm}>
            <h3 className="text-base font-semibold text-slate-900">Step 2: Term Configuration</h3>

            <SessionSelector
              options={sessionOptions}
              selectedSessionId={termSessionId}
              isLoading={isLoadingSessions}
              onChange={setTermSessionId}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="term-name">Term Name</label>
              <select
                id="term-name"
                value={termName}
                onChange={(event) => setTermName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {termNameOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="term-start-date">Start Date</label>
                <input
                  id="term-start-date"
                  type="date"
                  required
                  min={selectedTermSession?.sessionStartDate}
                  max={selectedTermSession?.sessionEndDate}
                  value={termStartDate}
                  onChange={(event) => setTermStartDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800" htmlFor="term-end-date">End Date</label>
                <input
                  id="term-end-date"
                  type="date"
                  required
                  min={selectedTermSession?.sessionStartDate}
                  max={selectedTermSession?.sessionEndDate}
                  value={termEndDate}
                  onChange={(event) => setTermEndDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {selectedTermSession ? (
              <p className="text-xs text-slate-500">
                Allowed term range: {selectedTermSession.sessionStartDate} to {selectedTermSession.sessionEndDate}
              </p>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800" htmlFor="term-number">Term Number</label>
              <input
                id="term-number"
                type="number"
                min={1}
                required
                value={termNumber}
                onChange={(event) => setTermNumber(Number(event.target.value || 1))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !termSessionId}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving Term...' : 'Save Term and Continue'}
            </button>
          </form>
        ) : null}

        {currentStep === 3 ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Step 3: School Levels</h3>

            <p className="text-sm text-slate-600">
              Select one or more levels to configure before moving on to class creation.
            </p>

            <div className="flex flex-wrap gap-3">
              {levelOptions.map((option) => {
                const isSelected = selectedLevelOrders.includes(option.order);

                return (
                  <button
                    key={option.order}
                    type="button"
                    onClick={() => toggleLevelSelection(option.order)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span>{option.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedLevels.length ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-800">Selected level order mapping:</p>
                <ul className="mt-2 space-y-1">
                  {selectedLevels.map((level) => (
                    <li key={level.order}>{level.name} = {level.order}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCreateLevels}
              disabled={isSubmitting || !selectedLevels.length}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving Levels...' : 'Continue'}
            </button>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <form className="space-y-4" onSubmit={handleCreateClasses}>
            <h3 className="text-base font-semibold text-slate-900">Step 4: Class Creation</h3>

            {isLoadingCreatedLevels ? (
              <p className="text-sm text-slate-500">Loading school levels...</p>
            ) : createdLevels.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-800">Select Level</p>
                <div className="flex flex-wrap gap-2">
                  {createdLevels.map((level) => {
                    const isActive = level.id === selectedClassLevelId;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => switchClassLevel(level.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {level.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No levels found yet. Go back and create levels first.</p>
            )}

            {selectedClassLevel ? (
              <p className="text-sm text-slate-600">
                Adding classes under <span className="font-medium text-slate-800">{selectedClassLevel.name}</span>.
              </p>
            ) : null}

            <div className="space-y-3">
              {selectedClassDrafts.map((draft) => (
                <div key={draft.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_180px_auto]">
                  <input
                    type="text"
                    required
                    value={draft.name}
                    onChange={(event) => updateClassDraft(draft.id, { name: event.target.value })}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="e.g. Primary 1"
                  />

                  <input
                    type="number"
                    min={1}
                    required
                    value={draft.classOrder}
                    onChange={(event) => updateClassDraft(draft.id, { classOrder: Number(event.target.value || 1) })}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Class Order"
                  />

                  <button
                    type="button"
                    onClick={() => removeClassDraft(draft.id)}
                    disabled={!selectedClassDrafts.length}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {selectedClassLevelId && !selectedClassDrafts.length ? (
              <p className="text-sm text-slate-500">No classes added for this level yet.</p>
            ) : null}

            <button
              type="button"
              onClick={addClassDraft}
              disabled={!selectedClassLevelId || isLoadingCreatedLevels || !createdLevels.length}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Add Another Class
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedClassLevelId}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating Classes...' : 'Save Classes for Selected Level'}
            </button>
          </form>
        ) : null}
      </div>
    </AuthLayout>
  );
}