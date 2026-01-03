
export interface StrengthStats {
  score: number;
  entropy: number;
  crackTime: string;
  suggestions: string[];
  warning: string;
}

export function analyzePassword(password: string): StrengthStats {
  if (!password) {
    return { score: 0, entropy: 0, crackTime: '0s', suggestions: [], warning: '' };
  }

  let entropy = 0;
  const length = password.length;
  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  entropy = length * Math.log2(poolSize || 1);

  let score = 0;
  if (entropy > 80) score = 4;
  else if (entropy > 60) score = 3;
  else if (entropy > 40) score = 2;
  else if (entropy > 20) score = 1;

  // Penalty for common patterns
  const suggestions: string[] = [];
  let warning = "";

  if (length < 8) {
    score = Math.max(0, score - 2);
    warning = "Password is too short.";
    suggestions.push("Use at least 12 characters.");
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    suggestions.push("Add special characters (!@#$%^&*).");
  }

  if (!/[0-9]/.test(password)) {
    suggestions.push("Include at least one number.");
  }

  const crackTime = calculateCrackTime(entropy);

  return {
    score: Math.min(4, Math.max(0, score)),
    entropy,
    crackTime,
    suggestions,
    warning
  };
}

function calculateCrackTime(entropy: number): string {
  const guessesPerSecond = 10e10; // High-end hardware
  const seconds = Math.pow(2, entropy) / guessesPerSecond;

  if (seconds < 1) return "instantly";
  if (seconds < 60) return `${Math.floor(seconds)} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.floor(seconds / 31536000)} years`;
  return "centuries";
}
