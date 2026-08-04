/**
 * Server-side AI image generation for production.
 * CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are read from Netlify env only —
 * never exposed to the browser bundle.
 */

const DEFAULT_MODEL = '@cf/black-forest-labs/flux-2-klein-4b';
const MAX_PROMPT_LENGTH = 2000;
const MAX_CITY_LENGTH = 100;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function sanitizePrompt(raw) {
  return String(raw)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PROMPT_LENGTH);
}

function sanitizeCity(raw) {
  return String(raw)
    .replace(/[^\p{L}\p{N}\s\-'.]/gu, '')
    .trim()
    .slice(0, MAX_CITY_LENGTH);
}

function enrichPrompt(prompt, city, year, scenario) {
  const parts = [prompt];
  if (Array.isArray(scenario.adaptation_measures) && scenario.adaptation_measures.length) {
    parts.push(`Adaptation context: ${scenario.adaptation_measures.join(', ')}.`);
  }
  parts.push(
    `Documentary photograph of ${city}${year !== 2025 ? ` in ${year}` : ''}.`,
    'Photorealistic, calm, natural lighting, no text overlays, no dystopian destruction.'
  );
  return parts.join(' ').slice(0, 2500);
}

function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

function detectContentType(buffer) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  return 'image/png';
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: {}, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return json(503, {
      error:
        'AI generation is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in Netlify → Site configuration → Environment variables (Functions scope).',
      code: 'NOT_CONFIGURED',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (typeof body.prompt !== 'string') {
    return json(400, { error: 'prompt is required' });
  }

  const prompt = sanitizePrompt(body.prompt);
  if (!prompt) {
    return json(400, { error: 'prompt must not be empty' });
  }

  if (typeof body.city !== 'string') {
    return json(400, { error: 'city is required' });
  }

  const city = sanitizeCity(body.city);
  if (!city) {
    return json(400, { error: 'city must not be empty' });
  }

  if (typeof body.year !== 'number' || !Number.isInteger(body.year)) {
    return json(400, { error: 'year is required and must be an integer' });
  }

  const scenario = body.scenario && typeof body.scenario === 'object' ? body.scenario : {};
  const enrichedPrompt = enrichPrompt(prompt, city, body.year, scenario);
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  const form = new FormData();
  form.append('prompt', enrichedPrompt);
  form.append('width', '1344');
  form.append('height', '768');
  form.append('guidance', '3.5');

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
    });

    const contentType = response.headers.get('content-type') ?? '';

    if (response.status === 401 || response.status === 403) {
      return json(502, {
        error: 'Cloudflare API authentication failed. Check your Netlify environment variables.',
        code: 'AUTH_FAILED',
      });
    }

    if (response.status === 429) {
      return json(429, { error: 'Workers AI daily quota exceeded', code: 'QUOTA_EXCEEDED' });
    }

    if (!response.ok) {
      const detail = await response.text();
      return json(502, {
        error: `Workers AI error (${response.status}): ${detail.slice(0, 120)}`,
        code: 'GENERATION_FAILED',
      });
    }

    let imageBuffer;

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (!payload.success || payload.errors?.length) {
        return json(502, {
          error: payload.errors?.[0]?.message ?? 'Workers AI returned an error',
          code: 'GENERATION_FAILED',
        });
      }
      const imageBase64 = payload.result?.image;
      if (!imageBase64) {
        return json(502, { error: 'Workers AI response missing image data', code: 'GENERATION_FAILED' });
      }
      imageBuffer = base64ToBuffer(imageBase64);
    } else {
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    if (!imageBuffer.length) {
      return json(502, { error: 'Workers AI returned an empty image', code: 'GENERATION_FAILED' });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': detectContentType(imageBuffer),
        'Cache-Control': 'private, max-age=3600',
        'X-AfterNow-Provider': 'netlify-function',
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return json(502, {
      error: err instanceof Error ? err.message : 'Image generation failed',
      code: 'GENERATION_FAILED',
    });
  }
}
