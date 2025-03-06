/**
 * Simple password strength checker:
 * - length >= 8 => +1
 * - has uppercase => +1
 * - has digit => +1
 * - has special character => +1
 *
 * Score 0-1 => weak
 * Score 2 => medium
 * Score >=3 => strong
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score >= 3) return 'strong';
  if (score === 2) return 'medium';
  return 'weak';
}

export function pickRandomPositions(n: number, total: number): number[] {
  const positions: number[] = [];
  while (positions.length < n) {
    const pos = Math.floor(Math.random() * total) + 1;
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions.sort((a, b) => a - b);
}
