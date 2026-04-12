export type MonthlyScorePoint = {
  month: string;
  score: number;
};

export type MonthlyNarrative = {
  month: string;
  note: string;
};

export type SubjectProgress = {
  subject: string;
  classPosition: number;
  trend: MonthlyScorePoint[];
  narratives: MonthlyNarrative[];
};

export type ClassStudentProfile = {
  id: string;
  name: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship: string;
  avatarInitials: string;
  subjects: SubjectProgress[];
};

export const CLASS_STUDENT_PROFILES: Record<number, ClassStudentProfile[]> = {
  1: [
    {
      id: 's1',
      name: 'Sarah Johnson',
      guardianName: 'Jane Johnson',
      guardianPhone: '+1 555 0161',
      guardianRelationship: 'Mother',
      avatarInitials: 'SJ',
      subjects: [
        {
          subject: 'Mathematics',
          classPosition: 1,
          trend: [
            { month: 'January', score: 82 },
            { month: 'February', score: 84 },
            { month: 'March', score: 87 },
            { month: 'April', score: 90 },
          ],
          narratives: [
            { month: 'January', note: 'Sarah demonstrated strong number sense and completed algebra drills with confidence.' },
            { month: 'February', note: 'She began explaining solution steps more clearly during class discussion.' },
            { month: 'March', note: 'Her consistency improved after targeted practice on word problems.' },
            { month: 'April', note: 'Sarah is now leading peer support during recap exercises.' },
          ],
        },
        {
          subject: 'Science',
          classPosition: 2,
          trend: [
            { month: 'January', score: 78 },
            { month: 'February', score: 80 },
            { month: 'March', score: 83 },
            { month: 'April', score: 86 },
          ],
          narratives: [
            { month: 'January', note: 'She handled lab safety routines well and followed experimental instructions carefully.' },
            { month: 'February', note: 'Sarah asked thoughtful questions during the states of matter lesson.' },
            { month: 'March', note: 'Her practical work showed improved observation and recording skills.' },
            { month: 'April', note: 'She is becoming more precise with scientific vocabulary and explanations.' },
          ],
        },
      ],
    },
    {
      id: 's2',
      name: 'Michael Brown',
      guardianName: 'Peter Brown',
      guardianPhone: '+1 555 0152',
      guardianRelationship: 'Father',
      avatarInitials: 'MB',
      subjects: [
        {
          subject: 'Mathematics',
          classPosition: 2,
          trend: [
            { month: 'January', score: 76 },
            { month: 'February', score: 78 },
            { month: 'March', score: 80 },
            { month: 'April', score: 82 },
          ],
          narratives: [
            { month: 'January', note: 'Michael showed steady progress when working through guided examples.' },
            { month: 'February', note: 'He benefited from working in pairs to reinforce procedural steps.' },
            { month: 'March', note: 'His classwork became more accurate after review sessions.' },
            { month: 'April', note: 'Michael now completes most tasks with minimal prompting.' },
          ],
        },
        {
          subject: 'Science',
          classPosition: 1,
          trend: [
            { month: 'January', score: 84 },
            { month: 'February', score: 86 },
            { month: 'March', score: 88 },
            { month: 'April', score: 91 },
          ],
          narratives: [
            { month: 'January', note: 'Michael was quick to connect class demonstrations with everyday examples.' },
            { month: 'February', note: 'He produced clear lab notes and responded well to group tasks.' },
            { month: 'March', note: 'His practical assessment improved after focused revision.' },
            { month: 'April', note: 'He is now one of the stronger contributors during lab discussions.' },
          ],
        },
      ],
    },
    {
      id: 's3',
      name: 'Emily Davis',
      guardianName: 'Ada Davis',
      guardianPhone: '+1 555 0149',
      guardianRelationship: 'Mother',
      avatarInitials: 'ED',
      subjects: [
        {
          subject: 'Mathematics',
          classPosition: 3,
          trend: [
            { month: 'January', score: 71 },
            { month: 'February', score: 73 },
            { month: 'March', score: 76 },
            { month: 'April', score: 79 },
          ],
          narratives: [
            { month: 'January', note: 'Emily needed support with algebra setup but remained attentive.' },
            { month: 'February', note: 'Her confidence improved after working through guided practice in class.' },
            { month: 'March', note: 'She solved more independent problems with fewer errors.' },
            { month: 'April', note: 'Emily is building stronger problem-solving habits each week.' },
          ],
        },
        {
          subject: 'Science',
          classPosition: 3,
          trend: [
            { month: 'January', score: 74 },
            { month: 'February', score: 75 },
            { month: 'March', score: 78 },
            { month: 'April', score: 81 },
          ],
          narratives: [
            { month: 'January', note: 'Emily was observant during demonstrations and followed safety rules closely.' },
            { month: 'February', note: 'She began contributing more confidently during practical sessions.' },
            { month: 'March', note: 'Her written explanations became more detailed and accurate.' },
            { month: 'April', note: 'Emily now participates more consistently during science reviews.' },
          ],
        },
      ],
    },
  ],
  2: [
    {
      id: 's4',
      name: 'Isaac Cole',
      guardianName: 'Grace Cole',
      guardianPhone: '+1 555 0114',
      guardianRelationship: 'Mother',
      avatarInitials: 'IC',
      subjects: [
        {
          subject: 'Science',
          classPosition: 1,
          trend: [
            { month: 'January', score: 80 },
            { month: 'February', score: 82 },
            { month: 'March', score: 85 },
            { month: 'April', score: 88 },
          ],
          narratives: [
            { month: 'January', note: 'Isaac showed strong lab curiosity and asked useful follow-up questions.' },
            { month: 'February', note: 'His practical work was accurate and well-organized.' },
            { month: 'March', note: 'He demonstrated better understanding of scientific vocabulary.' },
            { month: 'April', note: 'Isaac is now working independently with confidence during experiments.' },
          ],
        },
        {
          subject: 'English',
          classPosition: 2,
          trend: [
            { month: 'January', score: 74 },
            { month: 'February', score: 76 },
            { month: 'March', score: 78 },
            { month: 'April', score: 80 },
          ],
          narratives: [
            { month: 'January', note: 'Isaac participated well in reading exercises and discussion prompts.' },
            { month: 'February', note: 'He improved his paragraph structure after feedback.' },
            { month: 'March', note: 'His written responses became clearer and more precise.' },
            { month: 'April', note: 'Isaac is showing steady growth in comprehension and expression.' },
          ],
        },
      ],
    },
    {
      id: 's5',
      name: 'Nora White',
      guardianName: 'Daniel White',
      guardianPhone: '+1 555 0105',
      guardianRelationship: 'Father',
      avatarInitials: 'NW',
      subjects: [
        {
          subject: 'Science',
          classPosition: 2,
          trend: [
            { month: 'January', score: 77 },
            { month: 'February', score: 79 },
            { month: 'March', score: 81 },
            { month: 'April', score: 84 },
          ],
          narratives: [
            { month: 'January', note: 'Nora stayed focused during practical demonstrations and followed instructions carefully.' },
            { month: 'February', note: 'She improved the clarity of her lab records after guided support.' },
            { month: 'March', note: 'Nora asked stronger analytical questions during revision sessions.' },
            { month: 'April', note: 'She is now more confident when explaining results to the class.' },
          ],
        },
        {
          subject: 'English',
          classPosition: 1,
          trend: [
            { month: 'January', score: 83 },
            { month: 'February', score: 85 },
            { month: 'March', score: 87 },
            { month: 'April', score: 90 },
          ],
          narratives: [
            { month: 'January', note: 'Nora was strong in reading comprehension and class discussion.' },
            { month: 'February', note: 'Her vocabulary use became more expressive and accurate.' },
            { month: 'March', note: 'She produced more polished written work with less prompting.' },
            { month: 'April', note: 'Nora is one of the most consistent contributors in English lessons.' },
          ],
        },
      ],
    },
  ],
  3: [
    {
      id: 's6',
      name: 'Daniel Kent',
      guardianName: 'Lucy Kent',
      guardianPhone: '+1 555 0191',
      guardianRelationship: 'Mother',
      avatarInitials: 'DK',
      subjects: [
        {
          subject: 'English',
          classPosition: 1,
          trend: [
            { month: 'January', score: 81 },
            { month: 'February', score: 83 },
            { month: 'March', score: 85 },
            { month: 'April', score: 88 },
          ],
          narratives: [
            { month: 'January', note: 'Daniel read confidently and handled comprehension tasks with care.' },
            { month: 'February', note: 'His paragraph writing showed stronger structure and clarity.' },
            { month: 'March', note: 'He participated more actively in literature discussion.' },
            { month: 'April', note: 'Daniel now demonstrates strong command of written expression.' },
          ],
        },
        {
          subject: 'History',
          classPosition: 2,
          trend: [
            { month: 'January', score: 75 },
            { month: 'February', score: 77 },
            { month: 'March', score: 79 },
            { month: 'April', score: 82 },
          ],
          narratives: [
            { month: 'January', note: 'Daniel engaged well with timeline exercises and source reading.' },
            { month: 'February', note: 'He began connecting historical events more effectively.' },
            { month: 'March', note: 'His written summaries became more detailed.' },
            { month: 'April', note: 'Daniel is building stronger historical reasoning skills.' },
          ],
        },
      ],
    },
    {
      id: 's7',
      name: 'Laura James',
      guardianName: 'Paul James',
      guardianPhone: '+1 555 0138',
      guardianRelationship: 'Father',
      avatarInitials: 'LJ',
      subjects: [
        {
          subject: 'English',
          classPosition: 2,
          trend: [
            { month: 'January', score: 78 },
            { month: 'February', score: 80 },
            { month: 'March', score: 82 },
            { month: 'April', score: 84 },
          ],
          narratives: [
            { month: 'January', note: 'Laura demonstrated good reading fluency and thoughtful responses.' },
            { month: 'February', note: 'She expanded her written responses after receiving feedback.' },
            { month: 'March', note: 'Laura contributed more consistently to pair work.' },
            { month: 'April', note: 'She is making steady progress in writing structure and detail.' },
          ],
        },
        {
          subject: 'History',
          classPosition: 1,
          trend: [
            { month: 'January', score: 82 },
            { month: 'February', score: 84 },
            { month: 'March', score: 86 },
            { month: 'April', score: 89 },
          ],
          narratives: [
            { month: 'January', note: 'Laura retained historical facts well and could place events in order.' },
            { month: 'February', note: 'She wrote clear answers and used evidence in her responses.' },
            { month: 'March', note: 'Her essays became more structured and analytical.' },
            { month: 'April', note: 'Laura is now leading the class in most review tasks.' },
          ],
        },
      ],
    },
  ],
  4: [
    {
      id: 's8',
      name: 'Nathan Ross',
      guardianName: 'Olivia Ross',
      guardianPhone: '+1 555 0180',
      guardianRelationship: 'Mother',
      avatarInitials: 'NR',
      subjects: [
        {
          subject: 'History',
          classPosition: 2,
          trend: [
            { month: 'January', score: 73 },
            { month: 'February', score: 75 },
            { month: 'March', score: 78 },
            { month: 'April', score: 81 },
          ],
          narratives: [
            { month: 'January', note: 'Nathan showed strong recall of historical events but needed support with sequencing.' },
            { month: 'February', note: 'His note-taking improved during source analysis.' },
            { month: 'March', note: 'He contributed more confidently to class discussion.' },
            { month: 'April', note: 'Nathan is now more precise when comparing timelines and causes.' },
          ],
        },
      ],
    },
    {
      id: 's9',
      name: 'Ava Kim',
      guardianName: 'Grace Kim',
      guardianPhone: '+1 555 0197',
      guardianRelationship: 'Mother',
      avatarInitials: 'AK',
      subjects: [
        {
          subject: 'History',
          classPosition: 1,
          trend: [
            { month: 'January', score: 84 },
            { month: 'February', score: 86 },
            { month: 'March', score: 88 },
            { month: 'April', score: 91 },
          ],
          narratives: [
            { month: 'January', note: 'Ava showed strong understanding of unit vocabulary and dates.' },
            { month: 'February', note: 'Her written answers became more detailed and evidence-based.' },
            { month: 'March', note: 'She used class reading materials more effectively.' },
            { month: 'April', note: 'Ava continues to set the pace for class discussion and revision.' },
          ],
        },
      ],
    },
  ],
};

export function getClassStudents(classId: number) {
  return CLASS_STUDENT_PROFILES[classId] || [];
}

export function getStudentProfile(classId: number, studentId: string) {
  return getClassStudents(classId).find((student) => student.id === studentId) || null;
}

export function getSubjectPerformance(studentId: string, classId: number, subject: string) {
  const student = getStudentProfile(classId, studentId);
  return student?.subjects.find((entry) => entry.subject === subject) || null;
}

export function toSubjectSlug(subject: string) {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
