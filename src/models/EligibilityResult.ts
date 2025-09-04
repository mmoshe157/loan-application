export interface EligibilityResult {
  eligible: boolean;
  reason: string;
  checks: {
    creditScore: boolean;
    income: boolean;
    crimeGrade: boolean;
  };
}

export interface EligibilityChecks {
  creditScore: boolean;
  income: boolean;
  crimeGrade: boolean;
}