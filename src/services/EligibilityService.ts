import { EligibilityResult, EligibilityChecks } from '../models/EligibilityResult';
import { LoanApplicationRequest } from '../models/LoanApplication';

export class EligibilityService {
  private static readonly MIN_CREDIT_SCORE = 700;
  private static readonly INCOME_MULTIPLIER = 1.5;
  private static readonly FAILING_CRIME_GRADE = 'F';

  evaluateEligibility(application: LoanApplicationRequest, crimeGrade: string): EligibilityResult {
    const checks: EligibilityChecks = {
      creditScore: this.validateCreditScore(application.creditScore),
      income: this.validateIncome(application.monthlyIncome, application.requestedAmount, application.loanTermMonths),
      crimeGrade: this.validateCrimeGrade(crimeGrade)
    };

    const eligible = checks.creditScore && checks.income && checks.crimeGrade;
    const reason = this.generateReason(checks, eligible);

    return {
      eligible,
      reason,
      checks
    };
  }

  private validateCreditScore(creditScore: number): boolean {
    return creditScore >= EligibilityService.MIN_CREDIT_SCORE;
  }

  private validateIncome(monthlyIncome: number, requestedAmount: number, loanTermMonths: number): boolean {
    const monthlyPayment = requestedAmount / loanTermMonths;
    const requiredIncome = monthlyPayment * EligibilityService.INCOME_MULTIPLIER;
    return monthlyIncome > requiredIncome;
  }

  private validateCrimeGrade(crimeGrade: string): boolean {
    return crimeGrade !== EligibilityService.FAILING_CRIME_GRADE;
  }

  private generateReason(checks: EligibilityChecks, eligible: boolean): string {
    if (eligible) {
      return 'Passed all checks';
    }

    const failedChecks: string[] = [];

    if (!checks.creditScore) {
      failedChecks.push('Credit score too low');
    }

    if (!checks.income) {
      failedChecks.push('Monthly income too low');
    }

    if (!checks.crimeGrade) {
      failedChecks.push('Property location has high crime rate');
    }

    return failedChecks.join(', ');
  }

  // Utility methods for testing and validation
  getMinCreditScore(): number {
    return EligibilityService.MIN_CREDIT_SCORE;
  }

  getIncomeMultiplier(): number {
    return EligibilityService.INCOME_MULTIPLIER;
  }

  getFailingCrimeGrade(): string {
    return EligibilityService.FAILING_CRIME_GRADE;
  }
}