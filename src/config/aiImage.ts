/** Server-side config injected by Vite at build time — never use VITE_ prefixed env vars here. */

export const AI_IMAGE_PROVIDER = __AI_IMAGE_PROVIDER__ as 'mock' | 'cloudflare';

/** Relative proxy path — resolved server-side by Vite (dev) or your production reverse proxy */
export const AI_GENERATION_ENDPOINT = '/api/generate-image';

export function isCloudflareProviderEnabled(): boolean {
  return AI_IMAGE_PROVIDER === 'cloudflare';
}
