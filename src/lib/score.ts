export type DisparityLabel =
  | 'Smaller racial gaps'
  | 'Moderate racial gaps'
  | 'Bigger racial gaps'
  | 'Not Enough Data';

export function disparityLabel(score: number | null): DisparityLabel {
  if (score === null) return 'Not Enough Data';
  if (score < 30) return 'Smaller racial gaps';
  if (score < 60) return 'Moderate racial gaps';
  return 'Bigger racial gaps';
}

export function disparityClass(score: number | null): string {
  if (score === null) return 'score-none';
  if (score < 30) return 'score-small';
  if (score < 60) return 'score-moderate';
  return 'score-big';
}

export function translatedDisparityLabel(score: number | null, lang: string): string {
  if (lang !== 'es') return disparityLabel(score);
  if (score === null) return 'Datos insuficientes';
  if (score < 30) return 'Brechas raciales más pequeñas';
  if (score < 60) return 'Brechas raciales moderadas';
  return 'Brechas raciales más grandes';
}
