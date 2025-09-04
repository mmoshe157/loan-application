export interface LoanApplication {
  id: string;
  applicantName: string;
  propertyAddress: string;
  creditScore: number;
  monthlyIncome: number;
  requestedAmount: number;
  loanTermMonths: number;
  eligible: boolean;
  reason: string;
  crimeGrade: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanApplicationRequest {
  applicantName: string;
  propertyAddress: string;
  creditScore: number;
  monthlyIncome: number;
  requestedAmount: number;
  loanTermMonths: number;
}

export interface LoanApplicationResponse {
  id: string;
  applicantName: string;
  propertyAddress: string;
  creditScore: number;
  monthlyIncome: number;
  requestedAmount: number;
  loanTermMonths: number;
  eligible: boolean;
  reason: string;
  crimeGrade: string;
}

export interface EligibilityChecks {
  creditScore: boolean;
  income: boolean;
  crimeGrade: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
  checks: EligibilityChecks;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface DatabaseLoanApplication {
  id: string;
  applicant_name: string;
  property_address: string;
  credit_score: number;
  monthly_income: number;
  requested_amount: number;
  loan_term_months: number;
  eligible: boolean;
  reason: string;
  crime_grade: string;
  created_at: string;
  updated_at: string;
}