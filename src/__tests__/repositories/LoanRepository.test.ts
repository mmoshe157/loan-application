import { Database } from '../../database/connection';
import { LoanRepository } from '../../repositories/LoanRepository';
import { LoanApplication } from '../../models';
import { NotFoundError } from '../../models/ErrorResponse';
import { v4 as uuidv4 } from 'uuid';

describe('LoanRepository', () => {
  let database: Database;
  let repository: LoanRepository;

  beforeAll(async () => {
    database = new Database(':memory:');
    await database.initialize();
    repository = new LoanRepository(database);
  });

  afterAll(async () => {
    await database.close();
  });

  describe('create', () => {
    it('should create a loan application successfully', async () => {
      const loanData: Omit<LoanApplication, 'createdAt' | 'updatedAt'> = {
        id: uuidv4(),
        applicantName: 'John Doe',
        propertyAddress: '123 Main St',
        creditScore: 750,
        monthlyIncome: 5000,
        requestedAmount: 100000,
        loanTermMonths: 24,
        eligible: true,
        reason: 'Passed all checks',
        crimeGrade: 'A'
      };

      const result = await repository.create(loanData);

      expect(result.id).toBe(loanData.id);
      expect(result.applicantName).toBe(loanData.applicantName);
      expect(result.eligible).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find a loan application by id', async () => {
      const loanData: Omit<LoanApplication, 'createdAt' | 'updatedAt'> = {
        id: uuidv4(),
        applicantName: 'Jane Smith',
        propertyAddress: '456 Oak Ave',
        creditScore: 720,
        monthlyIncome: 6000,
        requestedAmount: 150000,
        loanTermMonths: 36,
        eligible: false,
        reason: 'Credit score too low',
        crimeGrade: 'B'
      };

      await repository.create(loanData);
      const result = await repository.findById(loanData.id);

      expect(result.id).toBe(loanData.id);
      expect(result.applicantName).toBe(loanData.applicantName);
      expect(result.eligible).toBe(false);
    });

    it('should throw NotFoundError for non-existent id', async () => {
      const nonExistentId = uuidv4();
      
      await expect(repository.findById(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('findAll', () => {
    it('should return all loan applications', async () => {
      const result = await repository.findAll();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});