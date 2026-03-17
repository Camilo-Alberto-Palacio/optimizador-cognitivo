/**
 * Analytics Engine for biohacking correlations
 */

export interface CorrelationResult {
  factor: string;
  correlation: number; // Pearson correlation coefficient (-1 to 1)
  significance: 'high' | 'medium' | 'low';
  interpretation: string;
}

/**
 * Calculates the Pearson correlation coefficient between two arrays
 */
export const calculatePearson = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

/**
 * Interprets the correlation coefficient
 */
export const interpretCorrelation = (r: number): string => {
  const absR = Math.abs(r);
  if (absR >= 0.7) return 'Correlación Fuerte';
  if (absR >= 0.4) return 'Correlación Moderada';
  if (absR >= 0.2) return 'Correlación Débil';
  return 'Sin Correlación Clara';
};

/**
 * Gets the significance level
 */
export const getSignificance = (r: number): 'high' | 'medium' | 'low' => {
  const absR = Math.abs(r);
  if (absR >= 0.6) return 'high';
  if (absR >= 0.3) return 'medium';
  return 'low';
};
