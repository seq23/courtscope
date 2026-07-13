import judges from '../../data/fixtures/judges.json';
import cases from '../../data/fixtures/cases.json';
import type { JudgeSummary, CaseRecord } from './types';
export const fixtureJudges = judges as JudgeSummary[];
export const fixtureCases = cases as CaseRecord[];
export const findJudge = (slug: string) => fixtureJudges.find((j) => j.slug === slug);
export const findCase = (id: string) => fixtureCases.find((c) => c.publicCaseNumber.toLowerCase() === id.toLowerCase() || c.id.toLowerCase() === id.toLowerCase());
