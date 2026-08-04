/**
 * AfterNow — Cloudflare Worker for secure image generation via Workers AI.
 * API keys never leave this Worker; the frontend calls only /generate-image.
 */

const DEFAULT_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const MAX_CITY_LENGTH = 100;
const MAX_YEAR = 2200;
const MIN_YEAR = 2020;

interface Env {
  AI: Ai;
  ALLOWED_ORIGINS: string;
  MAX_PROMPT_LENGTH?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  AI_MODEL?: string;
  /** Local dev: REST API credentials synced from root .env via scripts/sync-dev-vars.mjs */
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
}

interface GenerateImageBody {
  prompt?: unknown;
  city?: unknown;
  year?: unknown;
  scenario?: unknown;
}

interface ScenarioPayload {
  temperature_change?: number;
  flood_risk?: number;
  wildfire_risk?: number;
  drought_risk?: number;
  sea_level_risk?: number;
  adaptation_measures?: string[];
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/** Per-isolate rate limit store (best-effort; resets on cold starts) */
const rateLimitStore = new Map<string, RateBucket>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const corsHeaders = buildCorsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      if (!origin || !isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname !== '/generate-image') {
      return jsonError(404, 'Not found', corsHeaders);
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed', corsHeaders);
    }

    if (origin && !isOriginAllowed(origin, env.ALLOWED_ORIGINS)) {
      return jsonError(403, 'Origin not allowed', corsHeaders);
    }

    const clientKey = request.headers.get('CF-Connecting-IP') ?? 'anonymous';
    const rateCheck = checkRateLimit(clientKey, env);
    if (!rateCheck.allowed) {
      return jsonError(
        429,
        'Rate limit exceeded. Please try again later.',
        corsHeaders,
        { retryAfterMs: rateCheck.retryAfterMs }
      );
    }

    let body: GenerateImageBody;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'Invalid JSON body', corsHeaders);
    }

    const validation = validateRequest(body, env);
    if (!validation.ok) {
      return jsonError(400, validation.error, corsHeaders);
    }

    const { prompt, city, year, scenario } = validation.data;

    try {
      const enrichedPrompt = enrichPrompt(prompt, city, year, scenario);
      const imageBytes = await generateImage(env, enrichedPrompt);
      const contentType = detectImageContentType(imageBytes);

      return new Response(imageBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
          'X-AfterNow-Provider': 'cloudflare-workers-ai',
          'X-AfterNow-Model': env.AI_MODEL ?? DEFAULT_MODEL,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed';
      const isQuota =
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('limit') ||
        message.toLowerCase().includes('exceeded');

      return jsonError(isQuota ? 429 : 502, sanitizeErrorMessage(message), corsHeaders, {
        code: isQuota ? 'QUOTA_EXCEEDED' : 'GENERATION_FAILED',
      });
    }
  },
};

function buildCorsHeaders(origin: string | null, allowedOrigins: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

function isOriginAllowed(origin: string, allowedOrigins: string): boolean {
  const list = allowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return list.includes(origin);
}

function checkRateLimit(
  clientKey: string,
  env: Env
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);
  const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS ?? '10', 10);
  const now = Date.now();

  let bucket = rateLimitStore.get(clientKey);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(clientKey, bucket);
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

function validateRequest(
  body: GenerateImageBody,
  env: Env
): { ok: true; data: ValidatedRequest } | { ok: false; error: string } {
  const maxPromptLength = parseInt(env.MAX_PROMPT_LENGTH ?? '2000', 10);

  if (typeof body.prompt !== 'string') {
    return { ok: false, error: 'prompt is required and must be a string' };
  }

  const prompt = sanitizePrompt(body.prompt);
  if (!prompt) {
    return { ok: false, error: 'prompt must not be empty' };
  }

  if (prompt.length > maxPromptLength) {
    return { ok: false, error: `prompt exceeds maximum length of ${maxPromptLength} characters` };
  }

  if (typeof body.city !== 'string') {
    return { ok: false, error: 'city is required and must be a string' };
  }

  const city = sanitizeCity(body.city);
  if (!city) {
    return { ok: false, error: 'city must not be empty' };
  }

  if (typeof body.year !== 'number' || !Number.isInteger(body.year)) {
    return { ok: false, error: 'year is required and must be an integer' };
  }

  if (body.year < MIN_YEAR || body.year > MAX_YEAR) {
    return { ok: false, error: `year must be between ${MIN_YEAR} and ${MAX_YEAR}` };
  }

  const scenario = sanitizeScenario(body.scenario);

  return {
    ok: true,
    data: { prompt, city, year: body.year, scenario },
  };
}

interface ValidatedRequest {
  prompt: string;
  city: string;
  year: number;
  scenario: ScenarioPayload;
}

function sanitizePrompt(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeCity(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s\-'.]/gu, '')
    .trim()
    .slice(0, MAX_CITY_LENGTH);
}

function sanitizeScenario(raw: unknown): ScenarioPayload {
  if (!raw || typeof raw !== 'object') return {};

  const s = raw as Record<string, unknown>;
  const scenario: ScenarioPayload = {};

  const numericFields = [
    'temperature_change',
    'flood_risk',
    'wildfire_risk',
    'drought_risk',
    'sea_level_risk',
  ] as const;

  for (const field of numericFields) {
    const val = s[field];
    if (typeof val === 'number' && Number.isFinite(val)) {
      scenario[field] = Math.max(0, Math.min(100, val));
    }
  }

  if (Array.isArray(s.adaptation_measures)) {
    scenario.adaptation_measures = s.adaptation_measures
      .filter((m): m is string => typeof m === 'string')
      .map((m) => m.slice(0, 120))
      .slice(0, 8);
  }

  return scenario;
}

function enrichPrompt(
  prompt: string,
  city: string,
  year: number,
  scenario: ScenarioPayload
): string {
  const parts = [prompt];

  if (scenario.adaptation_measures?.length) {
    parts.push(`Adaptation context: ${scenario.adaptation_measures.join(', ')}.`);
  }

  parts.push(
    `Documentary photograph of ${city}${year !== 2025 ? ` in ${year}` : ''}.`,
    'Photorealistic, calm, natural lighting, no text overlays, no dystopian destruction.'
  );

  return parts.join(' ').slice(0, 2500);
}

async function generateImage(env: Env, prompt: string): Promise<ArrayBuffer> {
  // Local dev: REST API with token from .dev.vars (Wrangler remote AI binding requires OAuth)
  if (env.CF_API_TOKEN && env.CF_ACCOUNT_ID) {
    return generateViaRestApi(env, prompt);
  }

  return generateViaBinding(env, prompt);
}

function buildGenerationForm(prompt: string): FormData {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', '1344');
  form.append('height', '768');
  form.append('guidance', '3.5');
  return form;
}

async function generateViaRestApi(env: Env, prompt: string): Promise<ArrayBuffer> {
  const model = env.AI_MODEL ?? DEFAULT_MODEL;
  const accountId = env.CF_ACCOUNT_ID!;
  const token = env.CF_API_TOKEN!;
  const form = buildGenerationForm(prompt);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    const detail = await response.text();
    const isAuth = response.status === 401 || response.status === 403;
    const isQuota = response.status === 429;
    if (isAuth) {
      throw new Error(
        'Cloudflare API authentication failed. Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN permissions (Workers AI Read + Edit required).'
      );
    }
    if (isQuota) {
      throw new Error('Workers AI daily quota exceeded');
    }
    throw new Error(`Workers AI REST API error (${response.status}): ${detail.slice(0, 120)}`);
  }

  // Workers AI REST API returns JSON with base64 image — see:
  // https://developers.cloudflare.com/workers-ai/get-started/rest-api/
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as {
      success?: boolean;
      result?: { image?: string };
      errors?: { message: string }[];
    };

    if (!payload.success || payload.errors?.length) {
      const msg = payload.errors?.[0]?.message ?? 'Workers AI returned an error';
      throw new Error(msg);
    }

    const imageBase64 = payload.result?.image;
    if (!imageBase64) {
      throw new Error('Workers AI response missing image data');
    }

    return base64ToArrayBuffer(imageBase64);
  }

  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) {
    throw new Error('Workers AI returned an empty image');
  }

  return bytes;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateViaBinding(env: Env, prompt: string): Promise<ArrayBuffer> {
  const model = env.AI_MODEL ?? DEFAULT_MODEL;
  const form = buildGenerationForm(prompt);

  const formResponse = new Response(form);
  const formStream = formResponse.body;
  const formContentType = formResponse.headers.get('content-type');

  if (!formStream || !formContentType) {
    throw new Error('Failed to prepare generation request');
  }

  const result = await env.AI.run(model, {
    multipart: {
      body: formStream,
      contentType: formContentType,
    },
  });

  return normalizeImageOutput(result);
}

async function normalizeImageOutput(result: unknown): Promise<ArrayBuffer> {
  if (result instanceof ArrayBuffer) return result;
  if (result instanceof Uint8Array) return result.buffer as ArrayBuffer;
  if (result instanceof Blob) return result.arrayBuffer();
  if (result instanceof ReadableStream) {
    return new Response(result).arrayBuffer();
  }
  if (result && typeof result === 'object' && 'image' in result) {
    const image = (result as { image: unknown }).image;
    return normalizeImageOutput(image);
  }

  throw new Error('Unexpected image output format from Workers AI');
}

function detectImageContentType(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes.slice(0, 4));
  if (view[0] === 0x89 && view[1] === 0x50) return 'image/png';
  if (view[0] === 0xff && view[1] === 0xd8) return 'image/jpeg';
  if (view[0] === 0x47 && view[1] === 0x49) return 'image/gif';
  if (view[0] === 0x52 && view[1] === 0x49) return 'image/webp';
  return 'image/png';
}

function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, '[redacted]')
    .replace(/api[_-]?key[=:]\S+/gi, '[redacted]')
    .slice(0, 200);
}

function jsonError(
  status: number,
  error: string,
  corsHeaders: Record<string, string>,
  extra?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error,
      status,
      ...extra,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
