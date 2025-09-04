import { EligibilityService } from '../../services/EligibilityService';
import { LoanApplicationRequest } from '../../models/LoanApplication';

describe('EligibilityService', () => {
  let eligibilityService: EligibilityService;

  beforeEach(() => {
    eligibilityService = new EligibilityService();
  });

  describe('evaluateEligibility', () => {
    const baseApplication: LoanApplicationRequest = {
      applicantName: 'John Doe',
      propertyAddress: '123 Main St',
      creditScore: 750,
      monthlyIncome: 10000, // Increased to pass income test: (150000/24)*1.5 = 9375, so 10000 > 9375
      requestedAmount: 150000,
      loanTermMonths: 24
    };

    it('should approve application when all criteria are met', () => {
      const result = eligibilityService.evaluateEligibility(baseApplication, 'A');

      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('Passed all checks');
      expect(result.checks.creditScore).toBe(true);
      expect(result.checks.income).toBe(true);
      expect(result.checks.crimeGrade).toBe(true);
    });

    it('should reject application when credit score is too low', () => {
      const application = { ...baseApplication, creditScore: 699 };
      const result = eligibilityService.evaluateEligibility(application, 'A');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Credit score too low');
      expect(result.checks.creditScore).toBe(false);
      expect(result.checks.income).toBe(true);
      expect(result.checks.crimeGrade).toBe(true);
    });

    it('should approve application when credit score is exactly 700', () => {
      const application = { ...baseApplication, creditScore: 700 };
      const result = eligibilityService.evaluateEligibility(application, 'A');

      expect(result.eligible).toBe(true);
      expect(result.checks.creditScore).toBe(true);
    });

    it('should reject application when monthly income is too low', () => {
      // Monthly payment = 150000 / 24 = 6250
      // Required income = 6250 * 1.5 = 9375
      // Setting income to 9375 should fail (needs to be > 9375)
      const application = { ...baseApplication, monthlyIncome: 9375 };
      const result = eligibilityService.evaluateEligibility(application, 'A');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Monthly income too low');
      expect(result.checks.creditScore).toBe(true);
      expect(result.checks.income).toBe(false);
      expect(result.checks.crimeGrade).toBe(true);
    });

    it('should approve application when monthly income is just above threshold', () => {
      // Monthly payment = 150000 / 24 = 6250
      // Required income = 6250 * 1.5 = 9375
      // Setting income to 9376 should pass
      const application = { ...baseApplication, monthlyIncome: 9376 };
      const result = eligibilityService.evaluateEligibility(application, 'A');

      expect(result.eligible).toBe(true);
      expect(result.checks.income).toBe(true);
    });

    it('should reject application when crime grade is F', () => {
      const result = eligibilityService.evaluateEligibility(baseApplication, 'F');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Property location has high crime rate');
      expect(result.checks.creditScore).toBe(true);
      expect(result.checks.income).toBe(true);
      expect(result.checks.crimeGrade).toBe(false);
    });

    it('should approve application with crime grades other than F', () => {
      const grades = ['A', 'B', 'C', 'D', 'E'];
      
      grades.forEach(grade => {
        const result = eligibilityService.evaluateEligibility(baseApplication, grade);
        expect(result.checks.crimeGrade).toBe(true);
      });
    });

    it('should reject application with multiple failing criteria', () => {
      const application = {
        ...baseApplication,
        creditScore: 650,
        monthlyIncome: 3000
      };
      const result = eligibilityService.evaluateEligibility(application, 'F');

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('Credit score too low, Monthly income too low, Property location has high crime rate');
      expect(result.checks.creditScore).toBe(false);
      expect(result.checks.income).toBe(false);
      expect(result.checks.crimeGrade).toBe(false);
    });

    it('should handle edge case with very short loan term', () => {
      const application = {
        ...baseApplication,
        requestedAmount: 12000,
        loanTermMonths: 1,
        monthlyIncome: 18001 // Needs > 18000 (12000 * 1.5)
      };
      const result = eligibilityService.evaluateEligibility(application, 'A');

      expect(result.eligible).toBe(true);
      expect(result.checks.income).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should return correct constants', () => {
      expect(eligibilityService.getMinCreditScore()).toBe(700);
      expect(eligibilityService.getIncomeMultiplier()).toBe(1.5);
      expect(eligibilityService.getFailingCrimeGrade()).toBe('F');
    });
  });
});