import registry from '../../data/cities/registry.json';

export type CityStatus = 'FIXTURE_PREVIEW' | 'VALIDATING' | 'PUBLISHED' | 'REJECTED' | 'PAUSED';

export interface CityRecord {
  slug: string;
  name: string;
  county: string;
  state: string;
  status: CityStatus;
  dashboardVisible: boolean;
  published: boolean;
  downloadsAvailable: boolean;
  dataMode: 'fixture' | 'published';
  courts: string[];
  coverageStart: string | null;
  coverageEnd: string | null;
  lastUpdated: string;
  notice: string;
  releaseId?: string | null;
}

export const cities = registry.cities as CityRecord[];
export const visibleCities = cities.filter((city) => city.dashboardVisible);
export const publishedCities = cities.filter((city) => city.published);
export const findCity = (slug: string | undefined): CityRecord | undefined =>
  cities.find((city) => city.slug === slug);
export const cityLabel = (city: CityRecord): string => `${city.name}, ${city.state}`;
export const cityStatusLabel = (city: CityRecord): string =>
  city.status.toLowerCase().replaceAll('_', ' ');
