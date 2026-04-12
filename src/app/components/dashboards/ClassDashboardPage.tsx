// import { useEffect, useMemo, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router';
// import { AlertCircle, ChevronLeft, ChevronDown, PencilLine, Trash2, Eye, Link2, Check, Clock } from 'lucide-react';
// import { Button } from '../Button';
// import { Card } from '../Card';
// import { Badge } from '../Badge';

// type TeacherClassRole = 'classTeacher' | 'subjectTeacher';
// type AttendanceState = 'present' | 'absent' | 'late';
// type GradingStatus = 'pending' | 'graded' | 'approved';

// function getGradingStatusVariant(status: GradingStatus) {
//   return status === 'graded' ? 'default' : (status as any);
// }
// type ActivityStatus = 'not_started' | 'in_progress' | 'completed';
// type AttendanceSession = 'morning' | 'afternoon' | 'subjectSpecific';

// type ClassMetadata = {
//   id: string;
//   className: string;
//   teacherRole: TeacherClassRole;
//   mySubject?: string;
//   subjectOversight: Array<{
//     subject: string;
//     teacher: string;
//     syllabusStatus: 'approved' | 'submitted' | 'rejected';
//   }>;
//   studentRoster: Array<{
//     id: string;
//     name: string;
//     attendance: string;
//   }>;
// };

// type WeeklyMaterial = {
//   week: number;
//   topic: string;
//   lessonNoteSnippet: string;
//   fullLessonNote: string;
//   stats: {
//     totalClassesScheduled: number;
//     testsSet: number;
//     assignments: number;
//     labsActivities: number;
//   };
// };

// type GradeItem = {
//   id: string;
//   studentName: string;
//   score: number;
//   maxScore: number;
//   type: string;
//   status: GradingStatus;
// };

// type WorkItem = {
//   id: string;
//   title: string;
//   description: string;
//   dueDate: string;
// };

// type StudentAttendanceRecord = {
//   studentId: string;
//   studentName: string;
//   state: AttendanceState;
// };

// type SessionRecord = {
//   id: string;
//   week: number;
//   date: string;
//   subject: string;
//   teacher: string;
//   editable: boolean;
//   attendance: {
//     records: StudentAttendanceRecord[];
//     lastModified: string;
//   };
//   subjectSummary: string;
//   grades: GradeItem[];
//   homework: WorkItem[];
//   tests: WorkItem[];
//   source?: 'teaching-console' | 'mock';
// };

// const classMetadataById: Record<string, ClassMetadata> = {
//   'a1b2c3d4-e5f6-7890-abcd-ef1234567819': {
//     id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567819',
//     className: 'Math 10A',
//     teacherRole: 'classTeacher',
//     subjectOversight: [
//       { subject: 'Mathematics', teacher: 'Mrs. Johnson', syllabusStatus: 'approved' },
//       { subject: 'English', teacher: 'Mr. Carter', syllabusStatus: 'submitted' },
//       { subject: 'Science', teacher: 'Ms. Ahmed', syllabusStatus: 'approved' },
//       { subject: 'Civic Education', teacher: 'Mr. Bello', syllabusStatus: 'rejected' },
//     ],
//     studentRoster: [
//       { id: 's1', name: 'Sarah Johnson', attendance: '96%' },
//       { id: 's2', name: 'Michael Brown', attendance: '91%' },
//       { id: 's3', name: 'Emily Davis', attendance: '94%' },
//     ],
//   },
// };

// const weeklyMaterialsByClass: Record<string, { currentWeek: number; weeks: WeeklyMaterial[] }> = {
//   'a1b2c3d4-e5f6-7890-abcd-ef1234567819': {
//     currentWeek: 4,
//     weeks: [
//       {
//         week: 1,
//         topic: 'Introduction to Algebra',
//         lessonNoteSnippet: 'Learners explored variables, expressions, and the role of algebra in problem solving.',
//         fullLessonNote:
//           'Learners explored variables, expressions, and the role of algebra in problem solving. The lesson focused on identifying terms, simplifying expressions, and applying basic algebraic rules to guided examples and short class practice.',
//         stats: { totalClassesScheduled: 5, testsSet: 1, assignments: 2, labsActivities: 1 },
//       },
//       {
//         week: 2,
//         topic: 'Linear Equations',
//         lessonNoteSnippet: 'The class practiced solving one-step and two-step equations with class participation.',
//         fullLessonNote:
//           'The class practiced solving one-step and two-step equations with class participation. Emphasis was placed on balancing both sides of the equation and checking answers using substitution.',
//         stats: { totalClassesScheduled: 5, testsSet: 1, assignments: 1, labsActivities: 1 },
//       },
//       {
//         week: 3,
//         topic: 'Quadratic Functions',
//         lessonNoteSnippet: 'Students introduced to quadratic expressions and the shape of their graphs.',
//         fullLessonNote:
//           'Students were introduced to quadratic expressions and the shape of their graphs. The session included graph sketching, discussion of turning points, and short differentiated exercises.',
//         stats: { totalClassesScheduled: 4, testsSet: 1, assignments: 2, labsActivities: 0 },
//       },
//       {
//         week: 4,
//         topic: 'Graphing Techniques',
//         lessonNoteSnippet: 'Graph plotting using coordinate grids and interpretation of axes and scales.',
//         fullLessonNote:
//           'Graph plotting using coordinate grids and interpretation of axes and scales. Learners practiced line graphs and bar graphs, then related the results to real classroom data.',
//         stats: { totalClassesScheduled: 6, testsSet: 1, assignments: 2, labsActivities: 2 },
//       },
//     ],
//   },
// };

// const seedSessionsByClass: Record<string, SessionRecord[]> = {
//   'a1b2c3d4-e5f6-7890-abcd-ef1234567819': [
//     {
//       id: 'sess-math-1',
//       week: 1,
//       date: '2026-04-01',
//       subject: 'Mathematics',
//       teacher: 'Mrs. Johnson',
//       editable: true,
//       attendance: {
//         records: [
//           { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
//           { studentId: 's2', studentName: 'Michael Brown', state: 'present' },
//           { studentId: 's3', studentName: 'Emily Davis', state: 'late' },
//         ],
//         lastModified: '2026-04-01T09:20:00Z',
//       },
//       subjectSummary: 'The class settled quickly and handled the algebra introduction with good participation.',
//       grades: [
//         { id: 'g1', studentName: 'Sarah Johnson', score: 85, maxScore: 100, type: 'Quiz', status: 'graded' },
//         { id: 'g2', studentName: 'Michael Brown', score: 78, maxScore: 100, type: 'Classwork', status: 'graded' },
//       ],
//       homework: [{ id: 'h1', title: 'Solve practice set 1', description: 'Problems 1-20 from textbook', dueDate: '2026-04-03' }],
//       tests: [{ id: 't1', title: 'Short Quiz', description: 'Variables and Expressions', dueDate: '2026-04-02' }],
//       source: 'mock',
//     },
//     {
//       id: 'sess-math-2',
//       week: 2,
//       date: '2026-04-03',
//       subject: 'Mathematics',
//       teacher: 'Mrs. Johnson',
//       editable: true,
//       attendance: {
//         records: [
//           { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
//           { studentId: 's2', studentName: 'Michael Brown', state: 'absent' },
//           { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
//         ],
//         lastModified: '2026-04-03T09:10:00Z',
//       },
//       subjectSummary: 'Linear equations practice showed stronger individual work but some board hesitation.',
//       grades: [{ id: 'g5', studentName: 'Nora White', score: 88, maxScore: 100, type: 'Homework', status: 'pending' }],
//       homework: [{ id: 'h4', title: 'Equation sheet', description: 'Solve 10 linear equations', dueDate: '2026-04-05' }],
//       tests: [{ id: 't2', title: 'Quiz 1', description: 'Linear Equations', dueDate: '2026-04-03' }],
//       source: 'mock',
//     },
//     {
//       id: 'sess-math-4',
//       week: 4,
//       date: '2026-04-07',
//       subject: 'Mathematics',
//       teacher: 'Mrs. Johnson',
//       editable: true,
//       attendance: {
//         records: [
//           { studentId: 's1', studentName: 'Sarah Johnson', state: 'present' },
//           { studentId: 's2', studentName: 'Michael Brown', state: 'present' },
//           { studentId: 's3', studentName: 'Emily Davis', state: 'present' },
//         ],
//         lastModified: '2026-04-07T09:40:00Z',
//       },
//       subjectSummary: 'Graph plotting was steady. The class benefited from the visual examples and quick corrections.',
//       grades: [{ id: 'g6', studentName: 'Michael Brown', score: 91, maxScore: 100, type: 'Classwork', status: 'approved' }],
//       homework: [{ id: 'h5', title: 'Graph workbook page', description: 'Pages 45-50', dueDate: '2026-04-09' }],
//       tests: [{ id: 't3', title: 'Graph skills check', description: 'Plotting and interpretation', dueDate: '2026-04-08' }],
//       source: 'mock',
//     },
//   ],
// };

// function getHistoryKey(classId: string) {
//   return `class-history:${classId}`;
// }

// function AttendanceTable({
//   records,
//   onAttendanceChange,
//   canEdit,
// }: {
//   records: StudentAttendanceRecord[];
//   onAttendanceChange: (studentId: string, state: AttendanceState) => void;
//   canEdit: boolean;
// }) {
//   const states: AttendanceState[] = ['present', 'absent', 'late'];
//   const stateLabels = { present: 'Present', absent: 'Absent', late: 'Late' };

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full">
//         <thead>
//           <tr className="border-b border-border">
//             <th className="text-left py-2 px-3">Student</th>
//             <th className="text-center py-2 px-3">Present</th>
//             <th className="text-center py-2 px-3">Absent</th>
//             <th className="text-center py-2 px-3">Late</th>
//           </tr>
//         </thead>
//         <tbody>
//           {records.map((record) => (
//             <tr key={record.studentId} className="border-b border-border">
//               <td className="py-2 px-3 text-sm">{record.studentName}</td>
//               {states.map((state) => (
//                 <td key={state} className="text-center py-2 px-3">
//                   <button
//                     type="button"
//                     disabled={!canEdit}
//                     onClick={() => onAttendanceChange(record.studentId, state)}
//                     className={`px-3 py-1 rounded text-xs font-medium transition ${
//                       record.state === state
//                         ? 'bg-primary text-primary-foreground'
//                         : 'bg-accent text-foreground'
//                     } ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
//                   >
//                     {state === 'present' ? '✓' : state === 'absent' ? '✗' : '⏱'}
//                   </button>
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function GradingConsole({
//   grades,
//   onGradeChange,
//   onGradeDelete,
//   canEdit,
// }: {
//   grades: GradeItem[];
//   onGradeChange: (gradeId: string, score: number, maxScore: number, status: GradingStatus) => void;
//   onGradeDelete: (gradeId: string) => void;
//   canEdit: boolean;
// }) {
//   const [savingId, setSavingId] = useState<string | null>(null);

//   const handleSave = (gradeId: string, score: number, maxScore: number, status: GradingStatus) => {
//     setSavingId(gradeId);
//     setTimeout(() => {
//       onGradeChange(gradeId, score, maxScore, status);
//       setSavingId(null);
//     }, 500);
//   };

//   return (
//     <div className="space-y-2">
//       {grades.map((grade) => (
//         <div key={grade.id} className="p-3 border border-border rounded bg-background flex flex-col gap-2">
//           <div className="flex items-center justify-between gap-2">
//             <div className="flex-1">
//               <p className="font-medium text-sm">{grade.studentName}</p>
//               <p className="text-xs text-muted-foreground">{grade.type}</p>
//             </div>
//             <Badge variant={getGradingStatusVariant(grade.status)}>{grade.status}</Badge>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
//             <div>
//               <label className="block text-xs text-muted-foreground mb-1">Score</label>
//               <input
//                 type="number"
//                 min="0"
//                 max={grade.maxScore}
//                 defaultValue={grade.score}
//                 disabled={!canEdit}
//                 className="w-full p-2 border border-border rounded bg-input-background text-sm"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-muted-foreground mb-1">Max Score</label>
//               <input
//                 type="number"
//                 min="1"
//                 defaultValue={grade.maxScore}
//                 disabled={!canEdit}
//                 className="w-full p-2 border border-border rounded bg-input-background text-sm"
//               />
//             </div>
//             <div>
//               <label className="block text-xs text-muted-foreground mb-1">Status</label>
//               <select
//                 defaultValue={grade.status}
//                 disabled={!canEdit}
//                 className="w-full p-2 border border-border rounded bg-input-background text-sm"
//               >
//                 <option value="pending">Pending</option>
//                 <option value="graded">Graded</option>
//                 <option value="approved">Approved</option>
//               </select>
//             </div>
//           </div>

//           {canEdit && (
//             <div className="flex gap-2 justify-end">
//               {savingId === grade.id ? (
//                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
//                   <Clock size={14} className="animate-spin" /> Saving...
//                 </div>
//               ) : (
//                 <>
//                   <Button
//                     size="sm"
//                     variant="primary"
//                     onClick={() => handleSave(grade.id, grade.score, grade.maxScore, grade.status)}
//                   >
//                     <Check size={14} className="mr-1" /> Save
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     onClick={() => onGradeDelete(grade.id)}
//                   >
//                     <Trash2 size={14} /> Delete
//                   </Button>
//                 </>
//               )}
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

// function HomeworkTestManager({
//   items,
//   label,
//   onEdit,
//   onDelete,
//   canEdit,
// }: {
//   items: WorkItem[];
//   label: string;
//   onEdit: (itemId: string, dueDate: string, description: string) => void;
//   onDelete: (itemId: string) => void;
//   canEdit: boolean;
// }) {
//   const [editingId, setEditingId] = useState<string | null>(null);

//   return (
//     <div>
//       <p className="font-medium mb-2 text-sm">{label}</p>
//       <div className="space-y-2">
//         {items.map((item) => (
//           <div key={item.id} className="p-3 border border-border rounded bg-background flex flex-col gap-2">
//             <div className="flex items-center justify-between gap-2">
//               <div className="flex-1">
//                 <p className="text-sm">{item.title}</p>
//                 <p className="text-xs text-muted-foreground">{item.description}</p>
//               </div>
//               <Badge variant="default">Due {item.dueDate}</Badge>
//             </div>
//             {canEdit && (
//               <div className="flex gap-2 justify-end">
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => setEditingId(editingId === item.id ? null : item.id)}
//                 >
//                   <PencilLine size={14} className="mr-1" /> Edit
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => onDelete(item.id)}
//                 >
//                   <Trash2 size={14} /> Delete
//                 </Button>
//               </div>
//             )}
//             {editingId === item.id && (
//               <div className="mt-2 p-2 border border-border rounded bg-accent/10 space-y-2">
//                 <input
//                   type="text"
//                   defaultValue={item.title}
//                   placeholder="Title"
//                   className="w-full p-2 border border-border rounded bg-input-background text-sm"
//                 />
//                 <textarea
//                   defaultValue={item.description}
//                   placeholder="Description"
//                   className="w-full p-2 border border-border rounded bg-input-background text-sm"
//                   rows={2}
//                 />
//                 <input
//                   type="date"
//                   defaultValue={item.dueDate}
//                   className="w-full p-2 border border-border rounded bg-input-background text-sm"
//                 />
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function SessionInstance({
//   session,
//   canEdit,
//   onUpdate,
// }: {
//   session: SessionRecord;
//   canEdit: boolean;
//   onUpdate: (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => void;
// }) {
//   const [expanded, setExpanded] = useState(false);
//   const [showAttendance, setShowAttendance] = useState(false);
//   const [editingSummary, setEditingSummary] = useState(false);
//   const [summaryDraft, setSummaryDraft] = useState(session.subjectSummary);

//   return (
//     <div className="border border-border rounded-lg overflow-hidden">
//       <button
//         type="button"
//         onClick={() => setExpanded(!expanded)}
//         className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
//       >
//         <div>
//           <p className="font-medium text-sm">{session.date} • {session.subject}</p>
//           <p className="text-xs text-muted-foreground">Teacher: {session.teacher}</p>
//         </div>
//         <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
//       </button>

//       {expanded && (
//         <div className="p-4 border-t border-border bg-accent/5 space-y-4">
//           {/* Subject Summary */}
//           <div>
//             <div className="flex items-center justify-between gap-2 mb-2">
//               <p className="font-medium text-sm">Subject Summary</p>
//               {canEdit && !editingSummary && (
//                 <Button size="sm" variant="outline" onClick={() => setEditingSummary(true)}>
//                   <PencilLine size={14} /> Edit
//                 </Button>
//               )}
//             </div>
//             {editingSummary && canEdit ? (
//               <div className="space-y-2">
//                 <textarea
//                   value={summaryDraft}
//                   onChange={(e) => setSummaryDraft(e.target.value)}
//                   className="w-full p-2 border border-border rounded bg-input-background text-sm"
//                   rows={3}
//                 />
//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     variant="primary"
//                     onClick={() => {
//                       onUpdate(session.id, (current) => ({
//                         ...current,
//                         subjectSummary: summaryDraft,
//                       }));
//                       setEditingSummary(false);
//                     }}
//                   >
//                     Save
//                   </Button>
//                   <Button size="sm" variant="outline" onClick={() => setEditingSummary(false)}>
//                     Cancel
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <p className="text-sm text-muted-foreground leading-5">{session.subjectSummary}</p>
//             )}
//           </div>

//           {/* Attendance Trigger */}
//           <div>
//             <div className="flex items-center justify-between gap-2 mb-2">
//               <p className="font-medium text-sm">
//                 Attendance: {session.attendance.records.filter((r) => r.state === 'present' || r.state === 'late').length}/{session.attendance.records.length}
//               </p>
//               {canEdit && (
//                 <Button size="sm" variant="outline" onClick={() => setShowAttendance(!showAttendance)}>
//                   {showAttendance ? 'Hide' : 'View'} Details
//                 </Button>
//               )}
//             </div>
//             {showAttendance && (
//               <AttendanceTable
//                 records={session.attendance.records}
//                 onAttendanceChange={(studentId, state) => {
//                   onUpdate(session.id, (current) => ({
//                     ...current,
//                     attendance: {
//                       ...current.attendance,
//                       records: current.attendance.records.map((r) => (r.studentId === studentId ? { ...r, state } : r)),
//                       lastModified: new Date().toISOString(),
//                     },
//                   }));
//                 }}
//                 canEdit={canEdit}
//               />
//             )}
//           </div>

//           {/* Grading Console */}
//           {session.grades.length > 0 && (
//             <div>
//               <p className="font-medium mb-2 text-sm">Grading Console</p>
//               <GradingConsole
//                 grades={session.grades}
//                 onGradeChange={(gradeId, score, maxScore, status) => {
//                   onUpdate(session.id, (current) => ({
//                     ...current,
//                     grades: current.grades.map((g) =>
//                       g.id === gradeId ? { ...g, score, maxScore, status } : g
//                     ),
//                   }));
//                 }}
//                 onGradeDelete={(gradeId) => {
//                   onUpdate(session.id, (current) => ({
//                     ...current,
//                     grades: current.grades.filter((g) => g.id !== gradeId),
//                   }));
//                 }}
//                 canEdit={canEdit}
//               />
//             </div>
//           )}

//           {/* Homework & Tests */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             {session.homework.length > 0 && (
//               <HomeworkTestManager
//                 items={session.homework}
//                 label="Homework"
//                 onEdit={() => {}}
//                 onDelete={(itemId) => {
//                   onUpdate(session.id, (current) => ({
//                     ...current,
//                     homework: current.homework.filter((h) => h.id !== itemId),
//                   }));
//                 }}
//                 canEdit={canEdit}
//               />
//             )}
//             {session.tests.length > 0 && (
//               <HomeworkTestManager
//                 items={session.tests}
//                 label="Tests"
//                 onEdit={() => {}}
//                 onDelete={(itemId) => {
//                   onUpdate(session.id, (current) => ({
//                     ...current,
//                     tests: current.tests.filter((t) => t.id !== itemId),
//                   }));
//                 }}
//                 canEdit={canEdit}
//               />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function WeeklyCard({
//   week,
//   weekMaterial,
//   sessions,
//   canEdit,
//   onSessionUpdate,
// }: {
//   week: number;
//   weekMaterial?: WeeklyMaterial;
//   sessions: SessionRecord[];
//   canEdit: boolean;
//   onSessionUpdate: (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => void;
// }) {
//   const [expanded, setExpanded] = useState(false);

//   return (
//     <div className="border border-border rounded-lg overflow-hidden">
//       <button
//         type="button"
//         onClick={() => setExpanded(!expanded)}
//         className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between bg-accent/20"
//       >
//         <div>
//           <p className="font-semibold">Week {week}</p>
//           {weekMaterial && <p className="text-sm text-muted-foreground">{weekMaterial.topic}</p>}
//           <p className="text-xs text-muted-foreground mt-1">{sessions.length} session(s)</p>
//         </div>
//         <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
//       </button>

//       {expanded && (
//         <div className="p-4 border-t border-border space-y-3">
//           {sessions.map((session) => (
//             <SessionInstance
//               key={session.id}
//               session={session}
//               canEdit={canEdit && session.editable}
//               onUpdate={onSessionUpdate}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export function ClassDashboardPage() {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [showFullNote, setShowFullNote] = useState(false);
//   const [selectedWeek, setSelectedWeek] = useState<number>(0);
//   const [historySessions, setHistorySessions] = useState<SessionRecord[]>([]);

//   const classMeta = useMemo(() => (id ? classMetadataById[id] : undefined), [id]);
//   const weeklyMaterials = useMemo(() => (id ? weeklyMaterialsByClass[id] : undefined), [id]);

//   useEffect(() => {
//     if (!id || !classMeta) return;
//     if (classMeta.teacherRole !== 'classTeacher') {
//       navigate(`/teaching-console/${id}`, { replace: true });
//     }
//   }, [classMeta, id, navigate]);

//   useEffect(() => {
//     if (!classMeta || !id || !weeklyMaterials) return;

//     const storedHistory = localStorage.getItem(`class-history:${id}`);

//     if (storedHistory) {
//       try {
//         setHistorySessions(JSON.parse(storedHistory));
//         setSelectedWeek(weeklyMaterials.currentWeek);
//         return;
//       } catch {
//         // fall through to seed data
//       }
//     }

//     const seedSessions = seedSessionsByClass[id] || [];
//     setHistorySessions(seedSessions);
//     setSelectedWeek(weeklyMaterials.currentWeek);
//     localStorage.setItem(`class-history:${id}`, JSON.stringify(seedSessions));
//   }, [classMeta, id, weeklyMaterials]);

//   const currentWeekData = useMemo(() => {
//     if (!weeklyMaterials) return undefined;
//     return weeklyMaterials.weeks.find((week) => week.week === (selectedWeek || weeklyMaterials.currentWeek)) || weeklyMaterials.weeks[0];
//   }, [weeklyMaterials, selectedWeek]);

//   const sessionsByWeek = useMemo(() => {
//     const grouped: Record<number, SessionRecord[]> = {};
//     historySessions.forEach((session) => {
//       if (!grouped[session.week]) grouped[session.week] = [];
//       grouped[session.week].push(session);
//     });
//     return grouped;
//   }, [historySessions]);

//   const currentWeekSessions = useMemo(() => {
//     return sessionsByWeek[selectedWeek || weeklyMaterials?.currentWeek || 0] || [];
//   }, [sessionsByWeek, selectedWeek, weeklyMaterials?.currentWeek]);

//   const historicalWeeks = useMemo(() => {
//     if (!weeklyMaterials) return [];
//     return weeklyMaterials.weeks
//       .filter((w) => w.week !== (selectedWeek || weeklyMaterials.currentWeek))
//       .sort((a, b) => b.week - a.week);
//   }, [selectedWeek, weeklyMaterials]);

//   const persistSessions = (nextSessions: SessionRecord[]) => {
//     if (!id) return;
//     setHistorySessions(nextSessions);
//     localStorage.setItem(`class-history:${id}`, JSON.stringify(nextSessions));
//   };

//   const updateSession = (sessionId: string, updater: (current: SessionRecord) => SessionRecord) => {
//     const nextSessions = historySessions.map((session) => (session.id === sessionId ? updater(session) : session));
//     persistSessions(nextSessions);
//   };

//   if (!classMeta || !weeklyMaterials) {
//     return (
//       <div className="p-6 max-w-7xl mx-auto space-y-4">
//         <div className="flex items-center gap-3">
//           <Button variant="outline" size="sm" onClick={() => navigate('/')}>
//             <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
//           </Button>
//         </div>
//         <Card title="Class Not Found">
//           <p className="text-muted-foreground">No class metadata found for the provided class_id.</p>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-6">
//       <div className="flex items-center justify-between gap-3 flex-wrap">
//         <div>
//           <div className="text-sm text-muted-foreground mb-1">
//             <Link to="/" className="hover:underline">Home</Link> <span className="mx-1">&gt;</span> Class <span className="mx-1">&gt;</span> {classMeta.className}
//           </div>
//           <h1 className="text-2xl">{classMeta.className}</h1>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" size="sm" onClick={() => navigate('/')}>
//             <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
//           </Button>
//           <Button variant="primary" size="sm" onClick={() => navigate(`/teaching-console/${classMeta.id}`)}>
//             Open Teaching Console
//           </Button>
//         </div>
//       </div>

//       {/* Current Week in Focus */}
//       {currentWeekData && (
//         <Card title={`Week ${currentWeekData.week} in Focus`}>
//           <div className="space-y-4">
//             <div className="flex items-center justify-between gap-3 flex-wrap">
//               <div>
//                 <Badge variant="default">Current Academic Week</Badge>
//                 <h2 className="text-2xl font-semibold mt-2">Week {currentWeekData.week}</h2>
//                 <p className="text-sm text-muted-foreground mt-1">{currentWeekData.topic}</p>
//               </div>
//               <div className="flex items-center gap-2">
//                 <select
//                   value={selectedWeek || weeklyMaterials.currentWeek}
//                   onChange={(e) => setSelectedWeek(Number(e.target.value))}
//                   className="p-2 border border-border rounded-lg bg-input-background text-sm"
//                 >
//                   <option value={weeklyMaterials.currentWeek}>Current Week</option>
//                   {weeklyMaterials.weeks
//                     .filter((w) => w.week !== weeklyMaterials.currentWeek)
//                     .map((w) => (
//                       <option key={w.week} value={w.week}>
//                         Week {w.week}
//                       </option>
//                     ))}
//                 </select>
//                 <Button size="sm" variant="outline" onClick={() => setShowFullNote(!showFullNote)}>
//                   {showFullNote ? 'Hide Full Note' : 'View Full Note'}
//                 </Button>
//               </div>
//             </div>

//             <div className="p-4 rounded-lg border border-border bg-accent/20">
//               <p className="text-sm leading-6 whitespace-pre-line">
//                 {showFullNote ? currentWeekData.fullLessonNote : currentWeekData.lessonNoteSnippet}
//               </p>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
//               <div className="p-4 rounded-lg border border-border bg-accent/20">
//                 <p className="text-xs text-muted-foreground">Classes</p>
//                 <p className="text-2xl font-semibold mt-1">{currentWeekData.stats.totalClassesScheduled}</p>
//               </div>
//               <div className="p-4 rounded-lg border border-border bg-accent/20">
//                 <p className="text-xs text-muted-foreground">Tests</p>
//                 <p className="text-2xl font-semibold mt-1">{currentWeekData.stats.testsSet}</p>
//               </div>
//               <div className="p-4 rounded-lg border border-border bg-accent/20">
//                 <p className="text-xs text-muted-foreground">Assignments</p>
//                 <p className="text-2xl font-semibold mt-1">{currentWeekData.stats.assignments}</p>
//               </div>
//               <div className="p-4 rounded-lg border border-border bg-accent/20">
//                 <p className="text-xs text-muted-foreground">Labs</p>
//                 <p className="text-2xl font-semibold mt-1">{currentWeekData.stats.labsActivities}</p>
//               </div>
//             </div>
//           </div>
//         </Card>
//       )}

//       {/* Current Week Sessions */}
//       <Card title="Class Instances">
//         <div className="space-y-3">
//           {currentWeekSessions.length > 0 ? (
//             currentWeekSessions.map((session) => (
//               <SessionInstance
//                 key={session.id}
//                 session={session}
//                 canEdit={session.editable}
//                 onUpdate={updateSession}
//               />
//             ))
//           ) : (
//             <div className="p-6 border border-dashed border-border rounded-lg text-center text-muted-foreground">
//               No sessions recorded for this week yet.
//             </div>
//           )}
//         </div>
//       </Card>

//       {/* Historical Records */}
//       {historicalWeeks.length > 0 && (
//         <Card title="Historical Records">
//           <div className="space-y-3">
//             {historicalWeeks.map((weekData) => (
//               <WeeklyCard
//                 key={weekData.week}
//                 week={weekData.week}
//                 weekMaterial={weekData}
//                 sessions={sessionsByWeek[weekData.week] || []}
//                 canEdit={true}
//                 onSessionUpdate={updateSession}
//               />
//             ))}
//           </div>
//         </Card>
//       )}

//       {/* Subject Oversight (Class Teacher Only) */}
//       {classMeta.teacherRole === 'classTeacher' && (
//         <Card title="Subject Oversight">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             {classMeta.subjectOversight.map((item) => (
//               <div key={`${item.subject}-${item.teacher}`} className="border border-border rounded-lg p-4 bg-accent/20">
//                 <div className="flex items-center justify-between gap-2">
//                   <p className="font-medium">{item.subject}</p>
//                   <Badge variant={item.syllabusStatus as any}>{item.syllabusStatus}</Badge>
//                 </div>
//                 <p className="text-sm text-muted-foreground mt-1">Teacher: {item.teacher}</p>
//               </div>
//             ))}
//           </div>
//         </Card>
//       )}
//     </div>
//   );
// }
