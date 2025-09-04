import { validateLoanApplication } from '../../utils/validation';
import { ValidationError } from '../../models/ErrorResponse';

describe('Validation Utils', () => {
  describe('validateLoanApplication', () => {
    const validData = {
      applicantName: 'John Doe',
      propertyAddress: '123 Main Street, Anytown, CA 12345',
      creditScore: 750,
      monthlyIncome: 8000,
      requestedAmount: 150000,
      loanTermMonths: 24
    };

    it('should validate correct loan application data', () => {
      const result = validateLoanApplication(validData);
      
      expect(result).toEqual({
        applicantName: 'John Doe',
        propertyAddress: '123 Main Street, Anytown, CA 12345',
        creditScore: 750,
        monthlyIncome: 8000,
        requestedAmount: 150000,
        loanTermMonths: 24
      });
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        ...validData,
        applicantName: '  John Doe  ',
        propertyAddress: '  123 Main Street, Anytown, CA 12345  '
      };

      const result = validateLoanApplication(dataWithWhitespace);
      
      expect(result.applicantName).toBe('John Doe');
      expect(result.propertyAddress).toBe('123 Main Street, Anytown, CA 12345');
    });

    describe('applicantName validation', () => {
      it('should throw error for missing applicantName', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).applicantName;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-string applicantName', () => {
        const invalidData = { ...validData, applicantName: 123 };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for empty applicantName', () => {
        const invalidData = { ...validData, applicantName: '' };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });
    });

    describe('propertyAddress validation', () => {
      it('should throw error for missing propertyAddress', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).propertyAddress;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-string propertyAddress', () => {
        const invalidData = { ...validData, propertyAddress: 123 };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });
    });

    describe('creditScore validation', () => {
      it('should throw error for missing creditScore', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).creditScore;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-number creditScore', () => {
        const invalidData = { ...validData, creditScore: '750' };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for creditScore below 300', () => {
        const invalidData = { ...validData, creditScore: 299 };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for creditScore above 850', () => {
        const invalidData = { ...validData, creditScore: 851 };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should accept creditScore at boundaries', () => {
        const minData = { ...validData, creditScore: 300 };
        const maxData = { ...validData, creditScore: 850 };

        expect(() => validateLoanApplication(minData)).not.toThrow();
        expect(() => validateLoanApplication(maxData)).not.toThrow();
      });
    });

    describe('monthlyIncome validation', () => {
      it('should throw error for missing monthlyIncome', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).monthlyIncome;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-number monthlyIncome', () => {
        const invalidData = { ...validData, monthlyIncome: '8000' };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for zero or negative monthlyIncome', () => {
        const zeroData = { ...validData, monthlyIncome: 0 };
        const negativeData = { ...validData, monthlyIncome: -1000 };

        expect(() => validateLoanApplication(zeroData)).toThrow(ValidationError);
        expect(() => validateLoanApplication(negativeData)).toThrow(ValidationError);
      });
    });

    describe('requestedAmount validation', () => {
      it('should throw error for missing requestedAmount', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).requestedAmount;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-number requestedAmount', () => {
        const invalidData = { ...validData, requestedAmount: '150000' };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for zero or negative requestedAmount', () => {
        const zeroData = { ...validData, requestedAmount: 0 };
        const negativeData = { ...validData, requestedAmount: -50000 };

        expect(() => validateLoanApplication(zeroData)).toThrow(ValidationError);
        expect(() => validateLoanApplication(negativeData)).toThrow(ValidationError);
      });
    });

    describe('loanTermMonths validation', () => {
      it('should throw error for missing loanTermMonths', () => {
        const invalidData = { ...validData };
        delete (invalidData as any).loanTermMonths;

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for non-number loanTermMonths', () => {
        const invalidData = { ...validData, loanTermMonths: '24' };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should throw error for zero or negative loanTermMonths', () => {
        const zeroData = { ...validData, loanTermMonths: 0 };
        const negativeData = { ...validData, loanTermMonths: -12 };

        expect(() => validateLoanApplication(zeroData)).toThrow(ValidationError);
        expect(() => validateLoanApplication(negativeData)).toThrow(ValidationError);
      });

      it('should throw error for loanTermMonths exceeding 480 months', () => {
        const invalidData = { ...validData, loanTermMonths: 481 };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(ValidationError);
      });

      it('should accept loanTermMonths at boundary (480 months)', () => {
        const boundaryData = { ...validData, loanTermMonths: 480 };

        expect(() => validateLoanApplication(boundaryData)).not.toThrow();
      });
    });

    describe('multiple validation errors', () => {
      it('should include all validation errors in message', () => {
        const invalidData = {
          applicantName: '',
          propertyAddress: 123,
          creditScore: 'invalid',
          monthlyIncome: -1000,
          requestedAmount: 0,
          loanTermMonths: 500
        };

        expect(() => validateLoanApplication(invalidData))
          .toThrow(expect.objectContaining({
            message: expect.stringContaining('applicantName is required'),
          }));
      });
    });
  });
});