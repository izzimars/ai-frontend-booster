import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Image as ImageIcon, ImagePlus, Lock, Save, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import { buildQuestionTemplateCsv, parseBulkQuestionsFile } from './questionImportUtils';

type QuestionType = 'Theory' | 'Objective' | 'Short Answer' | 'True/False';

type QuestionOption = {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  imageName: string;
};

type AnswerKey = {
  text: string;
  imageName: string;
  explanation: string;
};

type QuestionItem = {
  id: string;
  type: QuestionType;
  text: string;
  imageName: string;
  options: QuestionOption[];
  answerKey: AnswerKey;
};

type LessonEditorNoteState = {
  id: string;
  className: string;
  subject: string;
  week: number;
  noteStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  content?: string;
};

type LessonEditorContentDraft = {
  noteId: string;
  richTextContent: string;
  notesForAI: string;
  difficultyLevel: string;
  updatedAt: string;
};

type LessonEditorQuestionsDraft = {
  noteId: string;
  questions: QuestionItem[];
  updatedAt: string;
};

type FallbackPromptMode = 'content' | 'questions';

function debounce<T extends (...args: unknown[]) => void>(fn: T, delayMs: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  }) as T;
}

const defaultQuestionOptions: QuestionOption[] = [
  { label: 'A', text: '', imageName: '' },
  { label: 'B', text: '', imageName: '' },
  { label: 'C', text: '', imageName: '' },
  { label: 'D', text: '', imageName: '' },
];

const seedNotesById: Record<string, LessonEditorNoteState> = {
  'ln-10c-math-1': { id: 'ln-10c-math-1', className: 'Grade 10C', subject: 'Mathematics', week: 1, noteStatus: 'approved' },
  'ln-10c-math-2': { id: 'ln-10c-math-2', className: 'Grade 10C', subject: 'Mathematics', week: 2, noteStatus: 'submitted' },
  'ln-10c-math-4': { id: 'ln-10c-math-4', className: 'Grade 10C', subject: 'Mathematics', week: 4, noteStatus: 'draft' },
  'ln-11a-python-1': { id: 'ln-11a-python-1', className: 'Grade 11A', subject: 'Python', week: 1, noteStatus: 'approved' },
};

const seedLessonContentById: Record<string, string> = {
  'ln-10c-math-1': 'Lesson objective: Introduce algebraic expressions and variable notation through concrete examples.',
  'ln-10c-math-2': 'Warm-up on balancing equations, followed by guided one-step and two-step equation practice.',
  'ln-10c-math-4': 'Focus on graph interpretation and plotting points accurately on the Cartesian plane.',
  'ln-11a-python-1': 'Introduce Python syntax, variables, and conditionals with short coding drills.',
};

function getLessonEditorContentStorageKey(noteId: string) {
  return `lesson-content:${noteId}`;
}

function getLessonEditorQuestionsStorageKey(noteId: string) {
  return `lesson-questions:${noteId}`;
}

export function LessonEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const selectedClassFromQuery = queryParams.get('className') || '';
  const selectedSubjectFromQuery = queryParams.get('subject') || '';

  const locationState = location.state as
    | { selectedClass?: string; selectedSubject?: string; note?: LessonEditorNoteState }
    | undefined;

  const note = useMemo(() => {
    const fallback = noteId ? seedNotesById[noteId] : undefined;
    return locationState?.note || fallback;
  }, [locationState?.note, noteId]);

  const selectedClass = locationState?.selectedClass || selectedClassFromQuery || note?.className || '';
  const selectedSubject = locationState?.selectedSubject || selectedSubjectFromQuery || note?.subject || '';

  const [activeTab, setActiveTab] = useState<'content' | 'questions'>('content');
  const [notesForAI, setNotesForAI] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Medium');
  const [richTextContent, setRichTextContent] = useState('');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>('Theory');
  const [questionText, setQuestionText] = useState('');
  const [questionImageName, setQuestionImageName] = useState('');
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>(defaultQuestionOptions);
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [answerKeyImageName, setAnswerKeyImageName] = useState('');
  const [answerKeyExplanation, setAnswerKeyExplanation] = useState('');
  const [answerKeyIsTrue, setAnswerKeyIsTrue] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [lastContentSavedAt, setLastContentSavedAt] = useState<Date | null>(null);
  const [lastQuestionsSavedAt, setLastQuestionsSavedAt] = useState<Date | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showGeneratorOverlay, setShowGeneratorOverlay] = useState(false);
  const [isGeneratingContentDraft, setIsGeneratingContentDraft] = useState(false);
  const [fallbackPromptMode, setFallbackPromptMode] = useState<FallbackPromptMode>('content');
  const [fallbackPromptText, setFallbackPromptText] = useState('');
  const [fallbackPromptTitle, setFallbackPromptTitle] = useState('');
  const [showFallbackPromptModal, setShowFallbackPromptModal] = useState(false);
  const [copiedFallbackPrompt, setCopiedFallbackPrompt] = useState(false);
  const [fallbackPromptHint, setFallbackPromptHint] = useState('');
  const [generatorConfig, setGeneratorConfig] = useState({
    numQuestions: 3,
    focusArea: 'Comprehensive' as 'Comprehensive' | 'Key Terms' | 'Critical Thinking',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    formats: ['Objective', 'Theory', 'True/False'] as QuestionType[],
  });
  const [pendingAiQuestions, setPendingAiQuestions] = useState<QuestionItem[]>([]);
  const [showPendingReview, setShowPendingReview] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const bulkUploadInputRef = useRef<HTMLInputElement | null>(null);
  const answerImageInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedSaveQuestionsRef = useRef<() => void | null>(null);

  const isLocked = note?.noteStatus === 'approved';
  const hasContent = richTextContent.trim().length > 0;

  const getPromptTopic = () => {
    const notesTopic = notesForAI.trim();
    if (notesTopic) return notesTopic;
    const contentTopic = richTextContent.trim();
    if (contentTopic) return contentTopic.slice(0, 140);
    return selectedSubject || 'the lesson topic';
  };

  const buildFallbackPrompt = (mode: FallbackPromptMode) => {
    const gradeLabel = selectedClass || note?.className || 'the class';
    const topic = getPromptTopic();

    if (mode === 'content') {
      return [
        `Write a lesson note for ${selectedSubject || 'this subject'} targeting ${gradeLabel} for Week ${note?.week ?? 1}.`,
        `Focus on ${topic} at a ${difficultyLevel} level.`,
        'Include learning objectives, a warm-up, guided practice, and an exit ticket.',
      ].join(' ');
    }

    return [
      `Generate 5 ${generatorConfig.difficulty} questions for ${selectedSubject || 'this subject'} Week ${note?.week ?? 1} about ${topic}.`,
      'Format the response as a clear list with correct answers included.',
    ].join(' ');
  };

  const openFallbackPrompt = (mode: FallbackPromptMode, hint?: string) => {
    const prompt = buildFallbackPrompt(mode);
    setFallbackPromptMode(mode);
    setFallbackPromptText(prompt);
    setFallbackPromptTitle(mode === 'content' ? 'Manual AI Fallback - Lesson Note Prompt' : 'Manual AI Fallback - Question Prompt');
    setFallbackPromptHint(hint || 'If our internal AI is busy, copy this prompt and use it with ChatGPT or Claude, then paste the results back here.');
    setCopiedFallbackPrompt(false);
    setShowFallbackPromptModal(true);
  };

  const copyFallbackPromptToClipboard = async () => {
    if (!fallbackPromptText.trim()) return;

    await navigator.clipboard.writeText(fallbackPromptText);
    setCopiedFallbackPrompt(true);
    window.setTimeout(() => setCopiedFallbackPrompt(false), 1800);
  };

  const buildSnapshot = (payload: {
    richTextContent: string;
    notesForAI: string;
    difficultyLevel: string;
    questions: QuestionItem[];
  }) => JSON.stringify(payload);

  const currentSnapshot = buildSnapshot({
    richTextContent,
    notesForAI,
    difficultyLevel,
    questions,
  });

  const hasUnsavedChanges = isInitialized && !isLocked && currentSnapshot !== lastSavedSnapshot;

  useEffect(() => {
    if (!noteId || !note) return;

    const fallbackContent = note.content || seedLessonContentById[noteId] || '';
    const defaultContent = {
      richTextContent: fallbackContent,
      notesForAI: '',
      difficultyLevel: 'Medium',
    };

    const rawContentDraft = localStorage.getItem(getLessonEditorContentStorageKey(noteId));
    let loadedContent = defaultContent;
    let contentLastSavedAt: Date | null = null;

    if (rawContentDraft) {
      try {
        const parsed = JSON.parse(rawContentDraft) as Partial<LessonEditorContentDraft>;
        loadedContent = {
          richTextContent: typeof parsed.richTextContent === 'string' ? parsed.richTextContent : fallbackContent,
          notesForAI: typeof parsed.notesForAI === 'string' ? parsed.notesForAI : '',
          difficultyLevel: typeof parsed.difficultyLevel === 'string' ? parsed.difficultyLevel : 'Medium',
        };
        contentLastSavedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : null;
      } catch {
        loadedContent = defaultContent;
      }
    }

    setRichTextContent(loadedContent.richTextContent);
    setNotesForAI(loadedContent.notesForAI);
    setDifficultyLevel(loadedContent.difficultyLevel);
    setLastContentSavedAt(contentLastSavedAt);
    setLastSavedSnapshot(
      JSON.stringify({
        richTextContent: loadedContent.richTextContent,
        notesForAI: loadedContent.notesForAI,
        difficultyLevel: loadedContent.difficultyLevel,
        questions: [],
      }),
    );

    const rawQuestionsDraft = localStorage.getItem(getLessonEditorQuestionsStorageKey(noteId));
    let loadedQuestions: QuestionItem[] = [];
    let questionsLastSavedAt: Date | null = null;

    if (rawQuestionsDraft) {
      try {
        const parsed = JSON.parse(rawQuestionsDraft) as Partial<LessonEditorQuestionsDraft>;
        loadedQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
        questionsLastSavedAt = parsed.updatedAt ? new Date(parsed.updatedAt) : null;
      } catch {
        loadedQuestions = [];
      }
    }

    setQuestions(loadedQuestions);
    setLastQuestionsSavedAt(questionsLastSavedAt);
    setIsInitialized(true);
  }, [noteId, note]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const confirmLeaveWithUnsaved = () => {
    if (isLocked || !hasUnsavedChanges) return true;
    return window.confirm('You have unsaved changes. Leave this page without saving?');
  };

  const handleGenerateLessonDraft = async () => {
    if (isLocked) return;

    try {
      setIsGeneratingContentDraft(true);
      await new Promise((resolve) => setTimeout(resolve, 900));

      const promptHint = notesForAI.trim() || `${selectedSubject} lesson`;
      const generatedDraft = `AI draft (${difficultyLevel}): ${promptHint}.`;
      setRichTextContent((current) => `${current}${current ? '\n\n' : ''}${generatedDraft}`);
    } catch {
      openFallbackPrompt('content', 'The lesson draft generator could not complete. Copy this prompt and continue with an external AI tool.');
    } finally {
      setIsGeneratingContentDraft(false);
    }
  };

  const handleQuestionOptionChange = (label: 'A' | 'B' | 'C' | 'D', field: 'text' | 'imageName', value: string) => {
    setQuestionOptions((current) =>
      current.map((option) => (option.label === label ? { ...option, [field]: value } : option)),
    );
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionType('Theory');
    setQuestionText('');
    setQuestionImageName('');
    setQuestionOptions(defaultQuestionOptions);
    setAnswerKeyText('');
    setAnswerKeyImageName('');
    setAnswerKeyExplanation('');
    setAnswerKeyIsTrue(true);
  };

  const handleSaveQuestion = () => {
    const normalizedAnswerText = questionType === 'True/False' ? (answerKeyIsTrue ? 'True' : 'False') : answerKeyText.trim();
    if (!questionText.trim() || !normalizedAnswerText) return;

    const payload: QuestionItem = {
      id: editingQuestionId || `q-${crypto.randomUUID()}`,
      type: questionType,
      text: questionText,
      imageName: questionImageName,
      options: questionType === 'Objective' ? questionOptions : defaultQuestionOptions,
      answerKey: {
        text: normalizedAnswerText,
        imageName: answerKeyImageName,
        explanation: answerKeyExplanation,
      },
    };

    setQuestions((current) => {
      if (!editingQuestionId) return [...current, payload];
      return current.map((question) => (question.id === editingQuestionId ? payload : question));
    });

    resetQuestionForm();
  };

  const handleEditQuestion = (question: QuestionItem) => {
    setEditingQuestionId(question.id);
    setQuestionType(question.type);
    setQuestionText(question.text);
    setQuestionImageName(question.imageName);
    setQuestionOptions(question.options);
    setAnswerKeyText(question.answerKey.text);
    setAnswerKeyImageName(question.answerKey.imageName);
    setAnswerKeyExplanation(question.answerKey.explanation);
    setAnswerKeyIsTrue(question.answerKey.text === 'True');
  };

  const persistContentData = () => {
    if (!noteId || isLocked) return;

    const payload: LessonEditorContentDraft = {
      noteId,
      richTextContent,
      notesForAI,
      difficultyLevel,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(getLessonEditorContentStorageKey(noteId), JSON.stringify(payload));
    setLastContentSavedAt(new Date(payload.updatedAt));
    setLastSavedSnapshot(
      buildSnapshot({
        richTextContent,
        notesForAI,
        difficultyLevel,
        questions,
      }),
    );
  };

  const persistQuestionsData = (questionsToPersist: QuestionItem[] = questions) => {
    if (!noteId || isLocked) return;

    const payload: LessonEditorQuestionsDraft = {
      noteId,
      questions: questionsToPersist,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(getLessonEditorQuestionsStorageKey(noteId), JSON.stringify(payload));
    setLastQuestionsSavedAt(new Date(payload.updatedAt));
  };

  useEffect(() => {
    if (debouncedSaveQuestionsRef.current) {
      debouncedSaveQuestionsRef.current();
    }
  }, [questions]);

  useEffect(() => {
    debouncedSaveQuestionsRef.current = debounce(() => persistQuestionsData(), 2000);

    return () => {
      if (debouncedSaveQuestionsRef.current) {
        debouncedSaveQuestionsRef.current();
      }
    };
  }, [noteId, questions, isLocked]);

  const handleDownloadTemplate = () => {
    const blob = new Blob([buildQuestionTemplateCsv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lesson-question-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUploadQuestions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file || isLocked || !noteId) return;

    setIsImporting(true);
    setImportSummary('');
    setImportErrors([]);

    try {
      const result = await parseBulkQuestionsFile(file);
      const importedQuestions: QuestionItem[] = result.questions.map((parsed) => ({
        id: `q-${crypto.randomUUID()}`,
        type: parsed.kind,
        text: parsed.questionText,
        imageName: '',
        options: parsed.options.map((option) => ({
          label: option.label,
          text: option.text,
          imageName: '',
        })),
        answerKey: {
          text: parsed.answerKey,
          imageName: '',
          explanation: '',
        },
      }));

      setQuestions((current) => [...current, ...importedQuestions]);

      const summaryParts = [
        `${result.counts.Objective} Objective`,
        `${result.counts['Short Answer']} Short Answer`,
        `${result.counts['True/False']} True/False`,
        `${result.counts.Theory} Theory`,
      ].filter((part) => !part.startsWith('0 '));

      if (summaryParts.length > 0) {
        setImportSummary(`Successfully imported ${summaryParts.join(' and ')} questions.`);
      } else {
        setImportSummary('No valid questions were imported.');
      }

      setImportErrors(result.errors);
    } catch {
      setImportSummary('Import failed. Please check your file format and try again.');
      setImportErrors([]);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveAndClose = () => {
    if (!isLocked) {
      persistContentData();
      persistQuestionsData();
    }

    navigate('/', {
      state: {
        activeTab: 'lesson_notes',
        selectedClass,
        selectedSubject,
      },
    });
  };

  const generateAiQuestions = async () => {
    if (!richTextContent.trim()) {
      openFallbackPrompt('questions', 'Add lesson content first, or copy this prompt and generate the question set in an external AI tool.');
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Extract key phrases from content
      const contentWords = richTextContent.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const uniqueWords = Array.from(new Set(contentWords)).slice(0, 10);

      const questionDifficulty = generatorConfig.difficulty;

      // Generate mock questions based on focus area, difficulty and formats
      const generatedQuestions: QuestionItem[] = [];
      const selectedFormats = generatorConfig.formats;

      for (let i = 0; i < generatorConfig.numQuestions; i++) {
        const typeIndex = i % selectedFormats.length;
        const type = selectedFormats[typeIndex] as QuestionType;
        const keyPhrase = uniqueWords[i % uniqueWords.length] || 'lesson concept';

        let question: QuestionItem | null = null;

        if (type === 'Objective') {
          const optionLabels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          const correctLabel = optionLabels[Math.floor(Math.random() * 4)];
          const options: QuestionOption[] = optionLabels.map((label) => ({
            label,
            text:
              label === correctLabel
                ? `The correct ${questionDifficulty.toLowerCase()}-level understanding of ${keyPhrase} in this lesson`
                : `A distractor option related to ${keyPhrase}`,
            imageName: '',
          }));
          question = {
            id: `q-${crypto.randomUUID()}`,
            type: 'Objective',
            text: `[${questionDifficulty}] Based on the lesson, which statement best describes ${keyPhrase}?`,
            imageName: '',
            options,
            answerKey: {
              text: correctLabel,
              imageName: '',
              explanation: `The correct answer is ${correctLabel} because it aligns with the lesson content and expected ${questionDifficulty.toLowerCase()}-level mastery of ${keyPhrase}.`,
            },
          };
        } else if (type === 'Theory') {
          question = {
            id: `q-${crypto.randomUUID()}`,
            type: 'Theory',
            text: `[${questionDifficulty}] Explain the concept of "${keyPhrase}" in the context of this lesson.`,
            imageName: '',
            options: defaultQuestionOptions,
            answerKey: {
              text: `A ${questionDifficulty.toLowerCase()}-level explanation of ${keyPhrase}...`,
              imageName: '',
              explanation: `Sample marking scheme:\n- Identifies key ideas about ${keyPhrase} (2 marks)\n- Connects to lesson context at ${questionDifficulty.toLowerCase()} depth (2 marks)\n- Uses a clear supporting example (1 mark)`,
            },
          };
        } else if (type === 'True/False') {
          const isTrueFact = Math.random() > 0.5;
          question = {
            id: `q-${crypto.randomUUID()}`,
            type: 'True/False',
            text: isTrueFact
              ? `[${questionDifficulty}] ${keyPhrase} is a key concept introduced in this lesson.`
              : `[${questionDifficulty}] ${keyPhrase} is explicitly contradicted by the lesson content.`,
            imageName: '',
            options: [
              { label: 'A', text: 'True', imageName: '' },
              { label: 'B', text: 'False', imageName: '' },
            ],
            answerKey: {
              text: isTrueFact ? 'True' : 'False',
              imageName: '',
              explanation: `This statement is ${isTrueFact ? 'true' : 'false'} based on the lesson content about ${keyPhrase} at ${questionDifficulty.toLowerCase()} difficulty.`,
            },
          };
        } else if (type === 'Short Answer') {
          question = {
            id: `q-${crypto.randomUUID()}`,
            type: 'Short Answer',
            text: `[${questionDifficulty}] What is the significance of ${keyPhrase} in this lesson? (1-2 sentences)`,
            imageName: '',
            options: defaultQuestionOptions,
            answerKey: {
              text: `Expected answer should mention the relevance of ${keyPhrase} to the lesson with ${questionDifficulty.toLowerCase()}-level detail.`,
              imageName: '',
              explanation: `Award marks for responses that correctly identify how ${keyPhrase} contributes to the lesson's main learning outcomes.`,
            },
          };
        }

        if (question) {
          generatedQuestions.push(question);
        }
      }

      setPendingAiQuestions(generatedQuestions);
      setShowPendingReview(true);
      setShowGeneratorOverlay(false);
    } catch {
      openFallbackPrompt('questions', 'The internal question generator failed. Copy this prompt and continue in an external AI tool.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((current) => {
      const updated = current.filter((item) => item.id !== questionId);
      persistQuestionsData(updated);
      return updated;
    });
  };

  const addPendingQuestionToBank = (questionId: string) => {
    const questionToAdd = pendingAiQuestions.find((q) => q.id === questionId);
    if (questionToAdd) {
      setQuestions((current) => [...current, questionToAdd]);
      setPendingAiQuestions((current) => current.filter((q) => q.id !== questionId));
    }
  };

  const discardPendingQuestion = (questionId: string) => {
    setPendingAiQuestions((current) => current.filter((q) => q.id !== questionId));
  };

  const addAllPendingToBank = () => {
    setQuestions((current) => [...current, ...pendingAiQuestions]);
    setPendingAiQuestions([]);
    setShowPendingReview(false);
  };

  if (!noteId || !note) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <Card title="Lesson Note Not Found">
          <p className="text-muted-foreground">The requested lesson note is unavailable.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {isLocked && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Lock size={16} />
            <span>This lesson note is approved and locked. Save, upload, and AI actions are disabled.</span>
          </div>
        )}

        <div>
          <div className="text-sm text-muted-foreground">
            <Link
              to="/"
              className="hover:underline"
              onClick={(event) => {
                if (confirmLeaveWithUnsaved()) return;
                event.preventDefault();
              }}
            >
              Dashboard
            </Link>{' '}
            / Lesson Editor
          </div>
          <h1 className="text-2xl">Lesson Editor • Week {note.week}</h1>
          <p className="text-sm text-muted-foreground mt-1">{selectedClass} • {selectedSubject}</p>
        </div>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 ${activeTab === 'content' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 ${activeTab === 'questions' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
        >
          Questions
        </button>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-4">
          <Card
            title="Rich Text Editor"
            action={
              <Button size="sm" variant="outline" onClick={() => setIsToolsOpen((current) => !current)}>
                <Sparkles size={14} className="mr-1" /> {isToolsOpen ? 'Hide Tools' : 'Magic Tools'}
              </Button>
            }
          >
            {!hasContent && (
              <div className="mb-4 rounded-lg border border-dashed border-border bg-accent/20 p-4">
                <p className="font-medium">Getting Started</p>
                <p className="text-sm text-muted-foreground mt-1">Create your lesson manually, upload source material, or draft with AI tools.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => editorRef.current?.focus()}>
                    Start Typing
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={isLocked}>
                    <UploadCloud size={14} className="mr-1" /> Upload Document
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsToolsOpen(true)} disabled={isLocked}>
                    <Sparkles size={14} className="mr-1" /> Generate with AI
                  </Button>
                </div>
              </div>
            )}

            <textarea
              ref={editorRef}
              value={richTextContent}
              onChange={(event) => setRichTextContent(event.target.value)}
              rows={18}
              readOnly={isLocked}
              className="w-full p-3 border border-border rounded-lg bg-input-background font-mono text-sm"
              placeholder="Type lesson content here..."
            />
          </Card>

          {(isToolsOpen || !hasContent) && (
            <Card title="Magic Tools">
              <div className="space-y-3">
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  disabled={isLocked}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setRichTextContent((current) => `${current}${current ? '\n\n' : ''}Imported source document: ${file.name}`);
                    event.currentTarget.value = '';
                  }}
                />

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Notes for AI</label>
                  <textarea
                    value={notesForAI}
                    onChange={(event) => setNotesForAI(event.target.value)}
                    rows={4}
                    className="w-full p-3 border border-border rounded-lg bg-input-background"
                    placeholder="Provide context, learning objectives, or lesson direction..."
                    readOnly={isLocked}
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Difficulty Level</label>
                  <select
                    value={difficultyLevel}
                    onChange={(event) => setDifficultyLevel(event.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-input-background"
                    disabled={isLocked}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={isLocked} onClick={() => uploadInputRef.current?.click()}>
                    <UploadCloud size={14} className="mr-1" /> Upload Document
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLocked}
                    onClick={handleGenerateLessonDraft}
                  >
                    <Sparkles size={14} className="mr-1" /> {isGeneratingContentDraft ? 'Generating...' : 'Generate with AI'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isLocked}
                    onClick={() => openFallbackPrompt('content')}
                  >
                    <ClipboardList size={14} className="mr-1" /> Copy Fallback Prompt
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-2 rounded-md border border-dashed border-border bg-accent/20 px-3 py-2">
                  <span className="mt-0.5">i</span>
                  <span>If our internal AI is busy, copy this prompt and use it with ChatGPT or Claude, then paste the results back here.</span>
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          <Card title="Bulk Question Upload">
            <input
              ref={bulkUploadInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleBulkUploadQuestions}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkUploadInputRef.current?.click()}
                disabled={isLocked || isImporting}
              >
                {isImporting ? 'Importing...' : 'Bulk Upload Questions'}
              </Button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-sm text-primary hover:underline"
              >
                Download Template
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  richTextContent.trim()
                    ? setShowGeneratorOverlay(true)
                    : openFallbackPrompt('questions', 'Add lesson content first, or copy this prompt and create the question set in an external AI tool.')
                }
                disabled={isLocked}
              >
                <Sparkles size={14} className="mr-1" /> Generate from AI
              </Button>
              <Button size="sm" variant="outline" onClick={() => openFallbackPrompt('questions')} disabled={isLocked}>
                <ClipboardList size={14} className="mr-1" /> Copy Fallback Prompt
              </Button>
              <span className="text-xs text-muted-foreground">Accepted files: .csv, .xlsx</span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground flex items-start gap-2 rounded-md border border-dashed border-border bg-accent/20 px-3 py-2">
              <span className="mt-0.5">i</span>
              <span>If our internal AI is busy, copy this prompt and use it with ChatGPT or Claude, then paste the results back here.</span>
            </p>

            {importSummary && (
              <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{importSummary}</p>
            )}

            {importErrors.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Import Warnings</p>
                <ul className="mt-2 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  {importErrors.slice(0, 8).map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {showPendingReview && pendingAiQuestions.length > 0 && (
            <Card 
              title={`AI Generated Questions (${pendingAiQuestions.length})`}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPendingReview(false)}
                >
                  Hide
                </Button>
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Review the AI-generated questions below. Click <strong>Add</strong> to include them or <strong>Discard</strong> to skip.</p>
                
                {pendingAiQuestions.map((question) => (
                  <div key={question.id} className="rounded-lg border border-blue-300 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{question.type}</Badge>
                        <p className="text-sm font-medium">{question.text}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Answer: {question.answerKey.text || 'Not set'}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => addPendingQuestionToBank(question.id)}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => discardPendingQuestion(question.id)}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="primary" onClick={addAllPendingToBank}>
                    Add All to Bank
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPendingAiQuestions([]);
                      setShowPendingReview(false);
                    }}
                  >
                    Discard All
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card title="Advanced Question Builder">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Type</label>
                <select
                  value={questionType}
                  onChange={(event) => setQuestionType(event.target.value as QuestionType)}
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option>Theory</option>
                  <option>Objective</option>
                  <option>Short Answer</option>
                  <option>True/False</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Question Text</label>
                <textarea
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  rows={4}
                  className="w-full p-3 border border-border rounded-lg bg-input-background"
                  placeholder="Enter the question prompt..."
                />
                <label className="inline-flex mt-2">
                  <input
                    type="file"
                    className="hidden"
                    disabled={isLocked}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setQuestionImageName(file.name);
                    }}
                  />
                  <span className={`rounded-lg border border-border px-3 py-2 text-sm ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}`}>
                    <ImagePlus size={14} className="inline mr-1" /> Add Image/Diagram
                  </span>
                </label>
                {questionImageName && <p className="text-xs text-muted-foreground mt-1">Attached: {questionImageName}</p>}
              </div>

              {questionType === 'Objective' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Objective Options (A-D)</p>
                  {questionOptions.map((option) => (
                    <div key={option.label} className="rounded-lg border border-border p-2">
                      <div className="flex gap-2 items-center">
                        <span className="w-6 text-sm font-medium">{option.label}.</span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(event) => handleQuestionOptionChange(option.label, 'text', event.target.value)}
                          className="flex-1 p-2 border border-border rounded bg-input-background"
                          placeholder={`Option ${option.label}`}
                        />
                      </div>
                      <label className="inline-flex mt-2 ml-8">
                        <input
                          type="file"
                          className="hidden"
                          disabled={isLocked}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            handleQuestionOptionChange(option.label, 'imageName', file.name);
                          }}
                        />
                        <span className={`rounded-lg border border-border px-3 py-1.5 text-xs ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}`}>
                          <ImagePlus size={12} className="inline mr-1" /> Add Image
                        </span>
                      </label>
                      {option.imageName && <p className="text-xs text-muted-foreground ml-8 mt-1">Attached: {option.imageName}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">{questionType === 'Theory' ? 'Marking Scheme / Sample Answer' : questionType === 'True/False' ? 'Correct Answer' : 'Answer Key'}</label>
                {questionType === 'True/False' ? (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setAnswerKeyIsTrue(true)}
                      className={`px-4 py-2 rounded-lg border ${
                        answerKeyIsTrue
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-input-background text-muted-foreground'
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswerKeyIsTrue(false)}
                      className={`px-4 py-2 rounded-lg border ${
                        !answerKeyIsTrue
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-input-background text-muted-foreground'
                      }`}
                    >
                      False
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={answerKeyText}
                    onChange={(event) => setAnswerKeyText(event.target.value)}
                    rows={3}
                    className="w-full p-2 border border-border rounded bg-input-background"
                    placeholder={questionType === 'Objective' ? 'e.g. B' : 'Expected answer or marking guide...'}
                  />
                )}
              </div>

              {(questionType === 'Theory' || questionType === 'Short Answer') && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Explanation / Additional Notes</label>
                  <textarea
                    value={answerKeyExplanation}
                    onChange={(event) => setAnswerKeyExplanation(event.target.value)}
                    rows={2}
                    className="w-full p-2 border border-border rounded bg-input-background"
                    placeholder="Optional explanation or reference material..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Answer Image / Diagram</label>
                <input
                  ref={answerImageInputRef}
                  type="file"
                  className="hidden"
                  disabled={isLocked}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setAnswerKeyImageName(file.name);
                  }}
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => answerImageInputRef.current?.click()}
                  className={`rounded-lg border border-border px-3 py-2 text-sm ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'
                  }`}
                >
                  <ImagePlus size={14} className="inline mr-1" /> Add Answer Image
                </button>
                {answerKeyImageName && <p className="text-xs text-muted-foreground mt-1">Attached: {answerKeyImageName}</p>}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="primary" disabled={isLocked} onClick={handleSaveQuestion}>
                  {editingQuestionId ? 'Update Question' : 'Add Question'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetQuestionForm}>Clear</Button>
              </div>
            </div>
          </Card>

          <Card title="Question Bank">
            <div className="space-y-2">
              {questions.length === 0 && (
                <div className="p-4 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
                  No questions added yet.
                </div>
              )}

              {questions.map((question) => (
                <div key={question.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="default">{question.type}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditQuestion(question)} disabled={isLocked}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteQuestion(question.id)}
                        disabled={isLocked}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{question.text}</p>
                  <div className="mt-2 rounded-md border border-border bg-accent/30 p-2">
                    <p className="text-xs font-medium">Correct Answer</p>
                    <p className="mt-1 text-sm">{question.answerKey.text || 'Not set'}</p>
                    {question.answerKey.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground">Explanation: {question.answerKey.explanation}</p>
                    )}
                  </div>
                  {(question.imageName || question.answerKey.imageName || question.options.some((option) => option.imageName)) && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                      <ImageIcon size={12} /> Image attached
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
          </div>
        </div>
      )}
      </div>

      {/* Generator Overlay Modal */}
      {showGeneratorOverlay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card 
            title="AI Assessment Generator"
            className="w-full max-w-md"
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Generate questions based on your lesson content</p>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Number of Questions: {generatorConfig.numQuestions}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={generatorConfig.numQuestions}
                  onChange={(event) =>
                    setGeneratorConfig((prev) => ({
                      ...prev,
                      numQuestions: parseInt(event.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Focus Area</label>
                <select
                  value={generatorConfig.focusArea}
                  onChange={(event) =>
                    setGeneratorConfig((prev) => ({
                      ...prev,
                      focusArea: event.target.value as 'Comprehensive' | 'Key Terms' | 'Critical Thinking',
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option>Comprehensive</option>
                  <option>Key Terms</option>
                  <option>Critical Thinking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Difficulty Level</label>
                <select
                  value={generatorConfig.difficulty}
                  onChange={(event) =>
                    setGeneratorConfig((prev) => ({
                      ...prev,
                      difficulty: event.target.value as 'Easy' | 'Medium' | 'Hard',
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-input-background"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Format Mix</label>
                <div className="space-y-2">
                  {(['Objective', 'Theory', 'True/False', 'Short Answer'] as QuestionType[]).map((format) => (
                    <label key={format} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={generatorConfig.formats.includes(format)}
                        onChange={(event) => {
                          setGeneratorConfig((prev) => {
                            const updated = event.target.checked
                              ? [...prev.formats, format]
                              : prev.formats.filter((f) => f !== format);
                            return { ...prev, formats: updated as QuestionType[] };
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={generateAiQuestions}
                  disabled={isGeneratingQuestions || generatorConfig.formats.length === 0}
                  className="flex-1"
                >
                  {isGeneratingQuestions ? 'Generating...' : 'Generate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGeneratorOverlay(false)}
                  disabled={isGeneratingQuestions}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showFallbackPromptModal}
        onClose={() => setShowFallbackPromptModal(false)}
        title={fallbackPromptTitle}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFallbackPromptModal(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={copyFallbackPromptToClipboard}>
              <ClipboardList size={14} className="mr-1" /> {copiedFallbackPrompt ? 'Copied' : 'Click to Copy'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-accent/20 px-3 py-2 text-xs text-muted-foreground">
            {fallbackPromptHint}
          </div>
          <textarea
            readOnly
            value={fallbackPromptText}
            className="w-full min-h-[180px] rounded-lg border border-border bg-input-background p-3 text-sm"
          />
        </div>
      </Modal>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Badge variant={note.noteStatus === 'approved' ? 'approved' : note.noteStatus === 'submitted' ? 'submitted' : 'draft'}>
                {note.noteStatus}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {isLocked ? (
                  <span className="font-medium">Read Only</span>
                ) : (
                  <span>
                    Content{' '}
                    {hasUnsavedChanges
                      ? 'unsaved'
                      : lastContentSavedAt
                        ? `saved ${lastContentSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'not saved'}
                    {' • '}
                    Questions{' '}
                    {lastQuestionsSavedAt
                      ? `saved ${lastQuestionsSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'not saved'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isLocked ? (
            <div className="flex gap-2">
              {activeTab === 'content' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={persistContentData}
                    disabled={!hasUnsavedChanges}
                    className="opacity-80"
                  >
                    <Save size={14} className="mr-1" /> Save Content
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveAndClose}>
                    Save & Close
                  </Button>
                </>
              )}
              {activeTab === 'questions' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => persistQuestionsData()}
                    className="opacity-80"
                  >
                    <Save size={14} className="mr-1" /> Save Question Bank ({questions.length})
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveAndClose}>
                    Save & Close
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground font-medium">All actions disabled while approved</div>
          )}
        </div>
      </div>
    </div>
  );
}
