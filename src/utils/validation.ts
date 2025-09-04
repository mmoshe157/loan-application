import { LoanApplicationRequest } from '../types';
import { ValidationError } from '../models/ErrorResponse';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateLoanApplication(data: any): LoanApplicationRequest {
  const errors: string[] = [];

  // Check required fields
  if (!data.applicantName || typeof data.applicantName !== 'string') {
    errors.push('applicantName is required and must be a string');
  }

  if (!data.propertyAddress || typeof data.propertyAddress !== 'string') {
    errors.push('propertyAddress is required and must be a string');
  }

  if (typeof data.creditScore !== 'number' || data.creditScore < 300 || data.creditScore > 850) {
    errors.push('creditScore must be a number between 300 and 850');
  }

  if (typeof data.monthlyIncome !== 'number' || data.monthlyIncome <= 0) {
    errors.push('monthlyIncome must be a positive number');
  }

  if (typeof data.requestedAmount !== 'number' || data.requestedAmount <= 0) {
    errors.push('requestedAmount must be a positive number');
  }

  if (typeof data.loanTermMonths !== 'number' || data.loanTermMonths <= 0 || data.loanTermMonths > 480) {
    errors.push('loanTermMonths must be a positive number not exceeding 480 months');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  // Sanitize and return the data
  return sanitizeLoanApplication(data);
}

export function validateLoanApplicationSafe(data: any): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!data.applicantName || typeof data.applicantName !== 'string') {
    errors.push('applicantName is required and must be a string');
  }

  if (!data.propertyAddress || typeof data.propertyAddress !== 'string') {
    errors.push('propertyAddress is required and must be a string');
  }

  if (typeof data.creditScore !== 'number' || data.creditScore < 300 || data.creditScore > 850) {
    errors.push('creditScore must be a number between 300 and 850');
  }

  if (typeof data.monthlyIncome !== 'number' || data.monthlyIncome <= 0) {
    errors.push('monthlyIncome must be a positive number');
  }

  if (typeof data.requestedAmount !== 'number' || data.requestedAmount <= 0) {
    errors.push('requestedAmount must be a positive number');
  }

  if (typeof data.loanTermMonths !== 'number' || data.loanTermMonths <= 0 || data.loanTermMonths > 480) {
    errors.push('loanTermMonths must be a positive number not exceeding 480 months');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeLoanApplication(data: any): LoanApplicationRequest {
  return {
    applicantName: String(data.applicantName).trim(),
    propertyAddress: String(data.propertyAddress).trim(),
    creditScore: Number(data.creditScore),
    monthlyIncome: Number(data.monthlyIncome),
    requestedAmount: Number(data.requestedAmount),
    loanTermMonths: Number(data.loanTermMonths)
  };
}