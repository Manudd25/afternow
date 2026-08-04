import type { FutureImageProvider, FutureImageRequest, FutureImageResult } from '../types/visualization';
import { AI_GENERATION_ENDPOINT, isCloudflareProviderEnabled } from '../config/aiImage';

const REQUEST_TIMEOUT_MS = 90_000;

export class CloudflareFutureImageProvider implements FutureImageProvider {
  readonly name = 'cloudflare';

  isConfigured(): boolean {
    return isCloudflareProviderEnabled();
  }

  async getImage(request: FutureImageRequest): Promise<FutureImageResult> {
    if (!this.isConfigured()) {
      throw new Error('WORKER_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(AI_GENERATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: request.prompt.text,
          city: request.city.name,
          year: request.year,
          scenario: {
            temperature_change: request.scenario.temperatureChange,
            flood_risk: request.scenario.floodRisk,
            wildfire_risk: request.scenario.wildfireRisk,
            drought_risk: request.scenario.droughtRisk,
            sea_level_risk: request.scenario.seaLevelRisk,
            adaptation_measures: request.scenario.adaptationMeasures,
          },
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (response.status === 429) {
        throw new Error('QUOTA_EXCEEDED');
      }

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const payload = (await response.json()) as { error?: string; code?: string };
          if (payload.code === 'QUOTA_EXCEEDED') {
            throw new Error('QUOTA_EXCEEDED');
          }
          if (payload.code === 'NOT_CONFIGURED') {
            throw new Error('NOT_CONFIGURED');
          }
          if (payload.code === 'AUTH_FAILED') {
            throw new Error('AUTH_FAILED');
          }
          throw new Error(payload.error ?? `Worker error (${response.status})`);
        }
        throw new Error(`Worker error (${response.status})`);
      }

      if (contentType.includes('application/json')) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Unexpected JSON response from worker');
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error('Worker returned an empty image');
      }

      const imageUrl = URL.createObjectURL(blob);

      return {
        imageUrl,
        status: 'ready',
        scenario: request.scenario,
        prompt: request.prompt,
        metadata: {
          provider: 'cloudflare',
          timestamp: new Date().toISOString(),
          sources: request.scenario.sources,
          assumptions: request.scenario.assumptions,
          isIllustrative: true,
          isAiGenerated: true,
        },
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      if (err instanceof TypeError) {
        throw new Error('WORKER_UNREACHABLE');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export function isCloudflareProviderConfigured(): boolean {
  return isCloudflareProviderEnabled();
}
