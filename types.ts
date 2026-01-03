
export interface PasswordResult {
  score: number; // 0 to 4
  entropy: number;
  crackTime: string;
  suggestions: string[];
  warning: string;
  pwnedCount: number | null;
  isPwned: boolean;
  timestamp: number;
  passwordLabel: string; // Redacted or partial for history
}

export interface AnalysisHistoryItem extends PasswordResult {
  id: string;
}

export enum StrengthLevel {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  STRONG = 3,
  EXPERT = 4
}
