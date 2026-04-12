export type ImportedQuestionKind = 'Objective' | 'Theory' | 'Short Answer' | 'True/False';

export type ImportedOption = {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
};

export type ParsedImportedQuestion = {
  kind: ImportedQuestionKind;
  questionText: string;
  options: ImportedOption[];
  answerKey: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export type BulkImportResult = {
  questions: ParsedImportedQuestion[];
  errors: string[];
  counts: Record<ImportedQuestionKind, number>;
};

type RowRecord = Record<string, string>;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function getRowValue(row: RowRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseDifficulty(value: string): 'Easy' | 'Medium' | 'Hard' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'hard') return 'Hard';
  return 'Medium';
}

function parseType(value: string): ImportedQuestionKind | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'objective' || normalized === 'mcq' || normalized === 'multiple_choice') return 'Objective';
  if (normalized === 'theory') return 'Theory';
  if (normalized === 'short_answer' || normalized === 'short answer') return 'Short Answer';
  if (normalized === 'true_false' || normalized === 'true/false' || normalized === 'true false') return 'True/False';
  return null;
}

function toOptionList(values: string[]): ImportedOption[] {
  const mapped = values.map((text, index) => ({
    label: (['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D'),
    text: text.trim(),
  }));

  while (mapped.length < 4) {
    mapped.push({ label: (['A', 'B', 'C', 'D'][mapped.length] as 'A' | 'B' | 'C' | 'D'), text: '' });
  }

  return mapped.slice(0, 4);
}

function parseOptions(row: RowRecord): ImportedOption[] {
  const splitOptions = getRowValue(row, ['options'])
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (splitOptions.length > 0) {
    return toOptionList(splitOptions);
  }

  return toOptionList([
    getRowValue(row, ['option_a', 'a']),
    getRowValue(row, ['option_b', 'b']),
    getRowValue(row, ['option_c', 'c']),
    getRowValue(row, ['option_d', 'd']),
  ]);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsvToRows(csvText: string): RowRecord[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => normalizeHeader(header));

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<RowRecord>((row, header, index) => {
      row[header] = (cells[index] || '').trim();
      return row;
    }, {});
  });
}

function parseWorkbookRows(sheetRows: Record<string, unknown>[]): RowRecord[] {
  return sheetRows.map((raw) => {
    const row: RowRecord = {};
    Object.entries(raw).forEach(([key, value]) => {
      row[normalizeHeader(key)] = String(value ?? '').trim();
    });
    return row;
  });
}

function parseQuestionRows(rows: RowRecord[]): BulkImportResult {
  const errors: string[] = [];
  const questions: ParsedImportedQuestion[] = [];
  const counts: Record<ImportedQuestionKind, number> = {
    Objective: 0,
    Theory: 0,
    'Short Answer': 0,
    'True/False': 0,
  };

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const rawType = getRowValue(row, ['type']);
    const type = parseType(rawType);
    if (!type) {
      errors.push(`Row ${rowNumber} skipped: Missing or invalid question type.`);
      return;
    }

    const questionText = getRowValue(row, ['question_text', 'question', 'text']);
    if (!questionText) {
      errors.push(`Row ${rowNumber} skipped: Missing question text.`);
      return;
    }

    const answerKey = getRowValue(row, ['answer_key', 'answer']);
    const difficulty = parseDifficulty(getRowValue(row, ['difficulty']));

    let options: ImportedOption[] = toOptionList(['', '', '', '']);

    if (type === 'Objective') {
      options = parseOptions(row);
    }

    if (type === 'True/False') {
      options = toOptionList(['True', 'False', '', '']);
    }

    if (type === 'Theory') {
      options = toOptionList(['', '', '', '']);
    }

    const normalizedAnswer = type === 'Theory' ? '' : answerKey;

    questions.push({
      kind: type,
      questionText,
      options,
      answerKey: normalizedAnswer,
      difficulty,
    });

    counts[type] += 1;
  });

  return { questions, errors, counts };
}

export async function parseBulkQuestionsFile(file: File): Promise<BulkImportResult> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    const text = await file.text();
    const rows = parseCsvToRows(text);
    return parseQuestionRows(rows);
  }

  if (fileName.endsWith('.xlsx')) {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    return parseQuestionRows(parseWorkbookRows(rows));
  }

  return {
    questions: [],
    errors: ['Unsupported file type. Please upload a .csv or .xlsx file.'],
    counts: {
      Objective: 0,
      Theory: 0,
      'Short Answer': 0,
      'True/False': 0,
    },
  };
}

export function buildQuestionTemplateCsv() {
  return [
    'type,question_text,options,option_a,option_b,option_c,option_d,answer_key,difficulty',
    'objective,"What is 2 + 2?","4,3,2,1",,,, ,A,Easy',
    'short_answer,"Define photosynthesis",,,,,,,"Process plants use to make food",Medium',
    'true_false,"The Earth revolves around the Sun",,,,,,,True,Easy',
    'theory,"Explain Newton\'s first law in your own words",,,,,,,,Hard',
  ].join('\n');
}
