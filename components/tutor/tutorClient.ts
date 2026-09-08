'use client';

export interface TutorAskOptions {
  question: string;
  goal: string;
  stepTitle: string;
  stepDetail: string;
  stepAction: string;
  learnerId?: string;
  mode?: string;
}

export interface TutorReply {
  answer: string;
  concept?: string;
  difficulty?: string;
  hint?: string;
  next_step?: string;
  quality_score?: number;
  suggestions?: string[];
  isAi: boolean;
}

const DIRECT_BACKEND_URL = 'http://127.0.0.1:8000';
const PROXY_URL = '/api/tutor';
const TIMEOUT_MS = 14000;

function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
}

/**
 * Check if the Python AI Tutor backend is active and healthy.
 */
export async function checkTutorBackendHealth(): Promise<boolean> {
  if (!isLocalEnvironment()) {
    try {
      const res = await fetch(PROXY_URL, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      return Boolean(data.connected);
    } catch {
      return false;
    }
  }

  try {
    const res = await fetch(`${DIRECT_BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(1800),
    });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok' && data.tutor_available !== false;
    }
  } catch {
    // Fall back to probing Next.js proxy
    try {
      const res = await fetch(PROXY_URL, { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      return Boolean(data.connected);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Sends a question to the AI Tutor backend with rich grounded context.
 * Falls back gracefully to deterministic guidance if the service is unreachable.
 */
export async function askTutorBackend(opts: TutorAskOptions): Promise<TutorReply> {
  const payload = {
    learner_id: opts.learnerId || 'LEARNER_0001',
    mode: opts.mode || (opts.question.toLowerCase().includes('hint') ? 'hint' : 'explain'),
    question: opts.question,
    context: {
      goal: opts.goal,
      step_title: opts.stepTitle,
      step_detail: opts.stepDetail,
      suggested_action: opts.stepAction,
    },
  };

  // 1. Try Direct FastAPI Backend (fastest & handles CORS directly on localhost)
  if (isLocalEnvironment()) {
    try {
      const directRes = await fetch(`${DIRECT_BACKEND_URL}/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (directRes.ok) {
        const data = await directRes.json();
        return {
          answer: data.answer || 'I am ready to help you explore this quantum step.',
          concept: data.concept,
          difficulty: data.difficulty,
          hint: data.hint,
          next_step: data.next_step,
          quality_score: data.quality_score,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          isAi: true,
        };
      }
    } catch {
      // Direct call failed or timed out, attempt proxy next
    }
  }

  // 2. Try Next.js API Route Proxy
  try {
    const proxyRes = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        answer: data.answer || 'Grounded step response.',
        concept: data.concept,
        difficulty: data.difficulty,
        hint: data.hint,
        next_step: data.next_step,
        quality_score: data.quality_score,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        isAi: true,
      };
    }
  } catch {
    // Both network paths unreachable, fall through to deterministic guidance
  }

  // 3. Graceful Deterministic Fallback (never breaks UX)
  const qLower = opts.question.toLowerCase();
  let fallbackAnswer = `Keep this step concrete: ${opts.stepDetail}. Follow the suggested action: "${opts.stepAction}".`;

  if (qLower.includes('hint')) {
    fallbackAnswer = `Look for the smallest experiment that can answer the question. For this step: ${opts.stepDetail.toLowerCase()}`;
  } else if (qLower.includes('next') || qLower.includes('try')) {
    fallbackAnswer = `Your next move is “${opts.stepAction}”. When you finish, mark this step complete and I'll move you forward.`;
  }

  return {
    answer: fallbackAnswer,
    hint: `For this step: ${opts.stepDetail}`,
    next_step: opts.stepAction,
    isAi: false,
    suggestions: [
      'Why does H create superposition?',
      'Give me a hint for this step',
      'What should I try next?',
    ],
  };
}
