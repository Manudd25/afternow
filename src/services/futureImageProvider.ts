import type { FutureImageProvider, FutureImageRequest, FutureImageResult } from '../types/visualization';
import { isCloudflareProviderEnabled } from '../config/aiImage';
import { CloudflareFutureImageProvider } from './cloudflareFutureImageProvider';
import { MockFutureImageProvider } from './mockFutureImageProvider';

export const AI_GENERATION_COOLDOWN_MS = 30_000;

let cachedProvider: FutureImageProvider | null = null;
let lastGenerationAttemptAt = 0;
const lastGenerationAttemptByCity = new Map<string, number>();

/** Returns the configured provider (never includes secrets) */
export function getFutureImageProvider(): FutureImageProvider {
  if (cachedProvider) return cachedProvider;

  if (isCloudflareProviderEnabled()) {
    const cloudflare = new CloudflareFutureImageProvider();
    if (cloudflare.isConfigured()) {
      cachedProvider = cloudflare;
      return cachedProvider;
    }
  }

  cachedProvider = new MockFutureImageProvider();
  return cachedProvider;
}

export function isAiGenerationEnabled(): boolean {
  return getFutureImageProvider().name === 'cloudflare';
}

export function canAttemptGeneration(cityId?: string): boolean {
  if (cityId) {
    const last = lastGenerationAttemptByCity.get(cityId) ?? 0;
    return Date.now() - last >= AI_GENERATION_COOLDOWN_MS;
  }
  return Date.now() - lastGenerationAttemptAt >= AI_GENERATION_COOLDOWN_MS;
}

export function getGenerationCooldownRemainingMs(cityId?: string): number {
  const last = cityId
    ? (lastGenerationAttemptByCity.get(cityId) ?? 0)
    : lastGenerationAttemptAt;
  const elapsed = Date.now() - last;
  return Math.max(0, AI_GENERATION_COOLDOWN_MS - elapsed);
}

export function markGenerationAttempt(cityId?: string): void {
  const now = Date.now();
  lastGenerationAttemptAt = now;
  if (cityId) {
    lastGenerationAttemptByCity.set(cityId, now);
  }
}

/** Load mock image immediately — used for timeline/CSS updates */
export async function getMockImage(request: FutureImageRequest): Promise<FutureImageResult> {
  const mock = new MockFutureImageProvider();
  return mock.getImage(request);
}

/** Attempt Cloudflare generation; throws on failure (caller handles fallback) */
export async function generateCloudflareImage(
  request: FutureImageRequest,
  options?: { skipCooldownMark?: boolean }
): Promise<FutureImageResult> {
  if (!options?.skipCooldownMark) {
    markGenerationAttempt();
  }
  const cloudflare = new CloudflareFutureImageProvider();

  if (!cloudflare.isConfigured()) {
    throw new Error('WORKER_NOT_CONFIGURED');
  }

  return cloudflare.getImage(request);
}

export type { FutureImageProvider, FutureImageRequest, FutureImageResult };
