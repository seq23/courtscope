export type DataStrength = 'Strong' | 'Moderate' | 'Limited' | 'Not Enough Data';
export type Trend = 'Improving' | 'Stable' | 'Worsening' | 'Not yet established';

export interface GroupComparison {
  group: string;
  reference: string;
  incarcerationScore: number | null;
  incarcerationGapPercentagePoints: number | null;
  sentenceLengthScore: number | null;
  sentenceLengthDifferencePercent: number | null;
}

export interface JudgeSummary {
  slug: string;
  name: string;
  shortName: string;
  court: string;
  division: string;
  score: number | null;
  label: string;
  dataStrength: DataStrength;
  caseCount: number;
  nextElectionYear: number | null;
  trend: Trend;
  confidenceInterval?: [number, number] | null;
  incarcerationDisparityScore?: number | null;
  sentenceLengthDisparityScore?: number | null;
  strongestSignal?: string;
  comparisonHighlights?: string[];
  comparisonGroups?: GroupComparison[];
  analysisWindow?: string;
}

export interface CaseRecord {
  id: string;
  publicCaseNumber: string;
  judgeSlug: string;
  court: string;
  division: string;
  disposition: string;
  sentenceType: string;
  sentenceLengthMonths: number | null;
  pleaTrial: string;
  offenseGroup: string;
  priorRecordBand: string;
  sourceId: string;
  collectedAt: string;
  verifiedAt: string;
  includedInModel: boolean;
  methodologyVersion: string;
  qualityFlags: string[];
}
