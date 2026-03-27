import { normalizeInterviewCategory, type InterviewQuestion } from '@/lib/interview-questions';

function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { questions: unknown }).questions)) {
    return (raw as { questions: unknown[] }).questions;
  }
  throw new Error('JSON 须为题目数组，或形如 { "questions": [ ... ] }');
}

/**
 * 从 JSON 解析题目列表。每条须含 category、question、answer；可选 topic、difficulty、id。
 */
export function parseInterviewJson(raw: unknown): InterviewQuestion[] {
  const items = extractItems(raw);
  const out: InterviewQuestion[] = [];
  let serial = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const question = typeof o.question === 'string' ? o.question.trim() : '';
    const answer = typeof o.answer === 'string' ? o.answer.trim() : '';
    const catRaw = typeof o.category === 'string' ? o.category.trim() : '';
    if (!question || !answer || !catRaw) continue;

    const category = normalizeInterviewCategory(catRaw);
    if (!category) continue;

    serial += 1;
    const topic = typeof o.topic === 'string' ? o.topic.trim() : '';
    const difficulty = typeof o.difficulty === 'string' ? o.difficulty.trim() : '';
    const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : `q-${serial}`;

    out.push({ id, category, topic, question, answer, difficulty });
  }

  if (!out.length) {
    throw new Error('JSON 中无有效题目：请检查 category（须为 iOS/Android/Angular/TypeScript 等）、question、answer。');
  }

  return out;
}
