import { execSync } from 'child_process';
import { createHash } from 'crypto';

/**
 * Generates a deterministic seed for priority scoring
 * Uses: 
 * 1. Git remote URL
 * 2. First commit timestamp
 * 3. Project start timestamp (YYYYMMDDHHmm format)
 * 
 * @returns {string} 12-character hex seed
 */
export function generateSeed(): string {
  try {
    // Get git remote URL
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
    
    // Get first commit timestamp
    const firstCommitEpoch = execSync('git log --reverse --format=%ct | head -n1').toString().trim();
    
    // Get current timestamp in YYYYMMDDHHmm format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const startTime = `${year}${month}${day}${hours}${minutes}`;
    
    // Combine and hash
    const combined = `${remoteUrl}|${firstCommitEpoch}|${startTime}`;
    const hash = createHash('sha256').update(combined).digest('hex');
    
    // Return first 12 chars of hash
    return hash.substring(0, 12);
  } catch (error) {
    console.error('Error generating seed, using fallback:', error);
    // Fallback to a fixed seed if there's an error
    return 'a1b2c3d4e5f6';
  }
}

// Generate coefficients based on seed
export function generateCoefficients(seed: string) {
  const A = 7 + (parseInt(seed.slice(0, 2), 16) % 5);
  const B = 13 + (parseInt(seed.slice(2, 4), 16) % 7);
  const C = 3 + (parseInt(seed.slice(4, 6), 16) % 3);
  
  return { A, B, C };
}

// Calculate priority score
export function calculatePriorityScore(
  baseScore: number,
  signupLatencyMs: number,
  accountAgeDays: number,
  rapidActions: number,
  coefficients: { A: number; B: number; C: number }
): number {
  const { A, B, C } = coefficients;
  return (
    baseScore +
    (signupLatencyMs % A) +
    (accountAgeDays % B) -
    (rapidActions % C)
  );
}

// Generate and cache the seed and coefficients
const SEED = generateSeed();
const COEFFICIENTS = generateCoefficients(SEED);

export { SEED, COEFFICIENTS };