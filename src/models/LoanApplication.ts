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