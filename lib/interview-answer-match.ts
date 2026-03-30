/**
 * 本地规则匹配：用正则归一化文本 + 从参考答案提取「要点词块」，
 * 统计用户回答覆盖了多少要点（不调用 AI）。
 */

/** 标点、markdown、多余空白 → 统一为空格 */
const PUNCT_RE = /[\s`~!@#$%^&*()\-_=+[\]{}\\|;:'",.<>/?，。、；：「」『』【】《》？！…·～]+/g;

/** 英文/数字词 */
const ASCII_TOKEN_RE = /[a-z][a-z0-9_]*|\d+/g;

/** 连续 CJK 算作一个词块（如「闭包」「内存管理」） */
const CJK_RUN_RE = /[\u4e00-\u9fff]+/g;

const COMMON_CJK_STOP_UNIGRAM = new Set([
  '的',
  '了',
  '是',
  '在',
  '有',
  '和',
  '与',
  '或',
  '等',
  '为',
  '以',
  '及',
  '中',
  '对',
  '将',
  '可',
  '能',
  '会',
  '要',
]);

export type AnswerMatchDetail = {
  /** 0–100，整数 */
  percent: number;
  /** 与用户回答匹配到的参考要点（归一化后词块） */
  hits: string[];
  /** 参考答案中有、但用户回答中未明显出现的要点 */
  misses: string[];
  /** 从参考答案提取的要点总数（去重后） */
  refTokenCount: number;
};

function normalizeWhitespace(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(PUNCT_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 从参考回答中提取要点：英文单词、连续汉字串；单字汉字仅在不属于常用字时纳入。
 */
export function extractReferenceTokens(reference: string): string[] {
  const norm = normalizeWhitespace(reference);
  if (!norm) return [];

  const set = new Set<string>();

  for (const m of norm.matchAll(CJK_RUN_RE)) {
    const run = m[0];
    if (run.length >= 2 && run.length <= 8) {
      set.add(run);
    } else if (run.length > 8) {
      const step = run.length > 20 ? 2 : 1;
      let added = 0;
      for (let i = 0; i <= run.length - 2 && added < 14; i += step, added += 1) {
        set.add(run.slice(i, i + 2));
      }
    } else if (!COMMON_CJK_STOP_UNIGRAM.has(run)) {
      set.add(run);
    }
  }

  for (const m of norm.matchAll(ASCII_TOKEN_RE)) {
    const w = m[0];
    if (w.length >= 2 || /^\d+$/.test(w)) set.add(w);
  }

  return [...set].filter((t) => t.length > 0);
}

function tokenAppearsInUserText(userNorm: string, token: string): boolean {
  if (!token) return false;
  if (userNorm.includes(token)) return true;
  const re = new RegExp(
    token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s/g, '\\s+'),
    'i',
  );
  try {
    return re.test(userNorm);
  } catch {
    return userNorm.includes(token);
  }
}

/**
 * 基于参考要点的召回率 + 字符 bigram Dice 系数的混合分，避免只有极短参考答案时失真。
 */
export function scoreAnswerMatch(userAnswer: string, referenceAnswer: string): AnswerMatchDetail {
  const userNorm = normalizeWhitespace(userAnswer);
  const refNorm = normalizeWhitespace(referenceAnswer);

  if (!refNorm) {
    return { percent: 0, hits: [], misses: [], refTokenCount: 0 };
  }

  if (!userNorm) {
    const tokens = extractReferenceTokens(referenceAnswer);
    return {
      percent: 0,
      hits: [],
      misses: tokens,
      refTokenCount: tokens.length,
    };
  }

  const tokens = extractReferenceTokens(referenceAnswer);
  const refTokenCount = tokens.length;

  let hits: string[] = [];
  let misses: string[] = [];

  if (refTokenCount === 0) {
    const dice = diceBigramCoefficient(userNorm, refNorm);
    const percent = Math.round(dice * 100);
    return { percent, hits: [], misses: [], refTokenCount: 0 };
  }

  for (const t of tokens) {
    if (tokenAppearsInUserText(userNorm, t)) hits.push(t);
    else misses.push(t);
  }

  const recall = hits.length / refTokenCount;

  const dice = diceBigramCoefficient(userNorm, refNorm);
  const blended = recall * 0.72 + dice * 0.28;
  const percent = Math.min(100, Math.max(0, Math.round(blended * 100)));

  if (hits.length > 12) hits = hits.slice(0, 12);
  if (misses.length > 10) misses = misses.slice(0, 10);

  return { percent, hits, misses, refTokenCount };
}

function diceBigramCoefficient(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const bigrams = (s: string) => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const bg = s.slice(i, i + 2);
      if (bg.includes(' ')) continue;
      map.set(bg, (map.get(bg) ?? 0) + 1);
    }
    return map;
  };
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  let sumA = 0;
  for (const [k, c] of A) sumA += c;
  let sumB = 0;
  for (const [, c] of B) sumB += c;
  for (const [k, c] of A) {
    const cb = B.get(k);
    if (cb) inter += Math.min(c, cb);
  }
  if (sumA + sumB === 0) return 0;
  return (2 * inter) / (sumA + sumB);
}
