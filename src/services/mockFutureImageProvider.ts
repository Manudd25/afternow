import type { FutureImageProvider, FutureImageRequest, FutureImageResult } from '../types/visualization';
import { getPresentDayPhotoUrl } from './cityPresentDayPhotos';

/** Local SVG placeholders — always available, no external dependency */
const CITY_IMAGES: Record<string, string> = {
  berlin: '/images/cities/berlin.svg',
  rome: '/images/cities/rome.svg',
  madrid: '/images/cities/madrid.svg',
  amsterdam: '/images/cities/amsterdam.svg',
};

const GENERIC_CITY_IMAGE = '/images/cities/generic.svg';

function resolveBaseImage(cityId: string, cityName: string): string {
  const key = cityId.split('-')[0];
  return (
    CITY_IMAGES[key] ??
    CITY_IMAGES[cityName.toLowerCase()] ??
    GENERIC_CITY_IMAGE
  );
}

export class MockFutureImageProvider implements FutureImageProvider {
  readonly name = 'mock';

  async getImage(request: FutureImageRequest): Promise<FutureImageResult> {
    const referencePhoto =
      request.year === 2025
        ? getPresentDayPhotoUrl(request.city.id, request.city.name)
        : null;

    const imageUrl =
      referencePhoto ?? resolveBaseImage(request.city.id, request.city.name);

    return {
      imageUrl,
      status: 'ready',
      scenario: request.scenario,
      prompt: request.prompt,
      metadata: {
        provider: referencePhoto ? 'reference-photo' : 'mock',
        timestamp: new Date().toISOString(),
        sources: request.scenario.sources,
        assumptions: request.scenario.assumptions,
        isIllustrative: !referencePhoto,
      },
    };
  }
}

export function hasMockImage(cityId: string, cityName: string): boolean {
  const key = cityId.split('-')[0];
  return key in CITY_IMAGES || cityName.toLowerCase() in CITY_IMAGES;
}

export function getAvailableMockCities(): string[] {
  return Object.keys(CITY_IMAGES);
}
