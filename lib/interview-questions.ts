export type InterviewCategory =
  | 'iOS'
  | 'Android'
  | 'Angular'
  | 'TypeScript'
  | 'JavaScript'
  | 'CSS';

export type InterviewQuestion = {
  id: string;
  category: InterviewCategory;
  topic: string;
  question: string;
  answer: string;
  difficulty: string;
};

/** category 列 / JSON 字段取值（含 ts、js 等缩写）的统一归一化 */
export function normalizeInterviewCategory(cell: string): InterviewCategory | null {
  const s = cell.trim().toLowerCase();
  if (s === 'ios' || s === '苹果') return 'iOS';
  if (s === 'android' || s === '安卓') return 'Android';
  if (s === 'angular' || s.includes('angular')) return 'Angular';
  if (s === 'typescript' || s === 'ts') return 'TypeScript';
  if (s === 'javascript' || s === 'js') return 'JavaScript';
  if (s === 'css') return 'CSS';
  return null;
}
