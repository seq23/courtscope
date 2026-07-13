export type DataStrength = 'Strong' | 'Moderate' | 'Limited' | 'Not Enough Data';
export type Trend = 'Improving' | 'Stable' | 'Worsening';
export interface JudgeSummary {
  slug: string; name: string; shortName: string; court: string; division: string;
  score: number | null; label: string; dataStrength: DataStrength; caseCount: number;
  nextElectionYear: number; trend: Trend; confidenceInterval?: [number, number];
}
export interface CaseRecord {
  id: string; publicCaseNumber: string; judgeSlug: string; court: string; division: string;
  disposition: string; sentenceType: string; sentenceLengthMonths: number | null;
  pleaTrial: string; offenseGroup: string; priorRecordBand: string; sourceId: string;
  collectedAt: string; verifiedAt: string; includedInModel: boolean; methodologyVersion: string;
  qualityFlags: string[];
}
