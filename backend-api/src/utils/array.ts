/**
 * Fisher-Yates (Knuth) Shuffle algorithm
 * Đảm bảo phân phối ngẫu nhiên đồng đều O(n), không gây bias như `sort(() => 0.5 - Math.random())`
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
