import { fixtureCases, fixtureJudges } from './fixtures';
import { findCity } from './cities';
import type { CaseRecord, JudgeSummary } from './types';

const judgeModules = import.meta.glob('../../data/cities/published/*/judges.json', {
  eager: true,
  import: 'default',
}) as Record<string, JudgeSummary[]>;
const caseModules = import.meta.glob('../../data/cities/published/*/cases.json', {
  eager: true,
  import: 'default',
}) as Record<string, CaseRecord[]>;

function moduleForCity<T>(
  modules: Record<string, T>,
  citySlug: string,
  filename: 'judges.json' | 'cases.json',
): T | undefined {
  const suffix = `/published/${citySlug}/${filename}`;
  const key = Object.keys(modules).find((path) => path.endsWith(suffix));
  return key ? modules[key] : undefined;
}

export function cityJudges(citySlug: string): JudgeSummary[] {
  const city = findCity(citySlug);
  if (!city) return [];
  if (city.dataMode === 'fixture' && citySlug === 'memphis') return fixtureJudges;
  return moduleForCity(judgeModules, citySlug, 'judges.json') ?? [];
}

export function cityCases(citySlug: string): CaseRecord[] {
  const city = findCity(citySlug);
  if (!city) return [];
  if (city.dataMode === 'fixture' && citySlug === 'memphis') return fixtureCases;
  return moduleForCity(caseModules, citySlug, 'cases.json') ?? [];
}

export function findCityJudge(citySlug: string, judgeSlug: string): JudgeSummary | undefined {
  return cityJudges(citySlug).find((judge) => judge.slug === judgeSlug);
}

export function findCityCase(citySlug: string, value: string): CaseRecord | undefined {
  const normalized = value.toLowerCase();
  return cityCases(citySlug).find(
    (record) =>
      record.publicCaseNumber.toLowerCase() === normalized ||
      record.id.toLowerCase() === normalized,
  );
}
