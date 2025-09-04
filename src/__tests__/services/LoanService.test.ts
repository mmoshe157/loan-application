import { LoanService } from '../../services/LoanService';
import { LoanRepository } from '../../repositories/LoanRepository';
import { EligibilityService } from '../../services/EligibilityService';
import { CrimeAgentService } from '../../services/CrimeAgentService';
import { Database } from '../../database/connection';
import { LoanApplicationRequest } from '../../models/LoanApplication';
import { NotFoundError } from '../../models/ErrorResponse';

describe('LoanService', () => {
  let loanService: LoanService;
  let database: Database;
  let loanRepository: LoanRepository;
  let eligibilityService: EligibilityService;
  let crimeAgentService: CrimeAgentService;

  beforeAll(async () => {
    database = new Database(':memory:');
    await database.initialize();
    loanRepository = new LoanRepository(database);
    eligibilityService = new EligibilityService();
    crimeAgentService = new CrimeAgentService();
    loanService = new LoanService(loanRepository, eligibilityService, crimeAgentService);
  });

  afterAll(async () => {
    await database.close();
  });

  describe('createLoanApplication', () => {
    const validApplicationRequest: LoanApplicationRequest = {
      applicantName: 'John Doe',
      propertyAddress: '123 Beverly Hills Drive, CA 90210', // Use "hills" to ensure grade A
      creditScore: 750,
      monthlyIncome: 10000, // Increased to pass income test
      requestedAmount: 150000,
      loanTermMonths: 24
    };

    it('should create a loan application successfully with eligible result', async () => {
      const result = await loanService.createLoanApplication(validApplicationRequest);

      expect(result.id).toBeDefined();
      expect(result.applicantName).toBe(validApplicationRequest.applicantName);
      expect(result.propertyAddress).toBe(validApplicationRequest.propertyAddress);
      expect(result.creditScore).toBe(validApplicationRequest.creditScore);
      expect(result.monthlyIncome).toBe(validApplicationRequest.monthlyIncome);
      expect(result.requestedAmount).toBe(validApplicationRequest.requestedAmount);
      expect(result.loanTermMonths).toBe(validApplicationRequest.loanTermMonths);
      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('Passed all checks');
      expect(result.crimeGrade).toMatch(/^[A-F]$/);
    });

    it('should create a loan application with ineligible result due to low credit score', async () => {
      const ineligibleRequest = {
        ...validApplicationRequest,
        creditScore: 650
      };

      const result = await loanService.createLoanApplication(ineligibleRequest);

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Credit score too low');
    });

    it('should create a loan application with ineligible result due to low income', async () => {
      const ineligibleRequest = {
        ...validApplicationRequest,
        monthlyIncome: 3000 // Too low for the requested amount
      };

      const result = await loanService.createLoanApplication(ineligibleRequest);

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Monthly income too low');
    });

    it('should handle crime grade F correctly', async () => {
      // Use the utility method to test with a specific crime grade
      const result = await loanService.processApplicationWithMockCrimeGrade(
        validApplicationRequest,
        'F'
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Property location has high crime rate');
      expect(result.crimeGrade).toBe('F');
    });

    it('should generate unique IDs for different applications', async () => {
      const result1 = await loanService.createLoanApplication(validApplicationRequest);
      const result2 = await loanService.createLoanApplication(validApplicationRequest);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getLoanApplication', () => {
    it('should retrieve an existing loan application', async () => {
      const applicationRequest: LoanApplicationRequest = {
        applicantName: 'Jane Smith',
        propertyAddress: '456 Oak Avenue, Springfield, IL 62701',
        creditScore: 720,
        monthlyIncome: 6000,
        requestedAmount: 120000,
        loanTermMonths: 30
      };

      const createdApplication = await loanService.createLoanApplication(applicationRequest);
      const retrievedApplication = await loanService.getLoanApplication(createdApplication.id);

      expect(retrievedApplication.id).toBe(createdApplication.id);
      expect(retrievedApplication.applicantName).toBe(applicationRequest.applicantName);
      expect(retrievedApplication.propertyAddress).toBe(applicationRequest.propertyAddress);
      expect(retrievedApplication.eligible).toBeDefined();
      expect(retrievedApplication.reason).toBeDefined();
      expect(retrievedApplication.crimeGrade).toBeDefined();
    });

    it('should throw NotFoundError for non-existent loan application', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(loanService.getLoanApplication(nonExistentId))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('getAllLoanApplications', () => {
    it('should retrieve all loan applications', async () => {
      const applications = await loanService.getAllLoanApplications();

      expect(Array.isArray(applications)).toBe(true);
      expect(applications.length).toBeGreaterThan(0);
      
      // Verify structure of returned applications
      applications.forEach(app => {
        expect(app.id).toBeDefined();
        expect(app.applicantName).toBeDefined();
        expect(app.propertyAddress).toBeDefined();
        expect(typeof app.eligible).toBe('boolean');
        expect(app.reason).toBeDefined();
        expect(app.crimeGrade).toMatch(/^[A-F]$/);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow for eligible application', async () => {
      const applicationRequest: LoanApplicationRequest = {
        applicantName: 'Alice Johnson',
        propertyAddress: '789 Park Avenue, Denver, CO 80202', // Use "park" to ensure grade A
        creditScore: 780,
        monthlyIncome: 15000, // Increased: (200000/36)*1.5 = 8333, so 15000 > 8333
        requestedAmount: 200000,
        loanTermMonths: 36
      };

      // Create application
      const createdApp = await loanService.createLoanApplication(applicationRequest);
      expect(createdApp.eligible).toBe(true);

      // Retrieve application
      const retrievedApp = await loanService.getLoanApplication(createdApp.id);
      expect(retrievedApp.id).toBe(createdApp.id);
      expect(retrievedApp.eligible).toBe(true);
    });

    it('should handle complete workflow for ineligible application', async () => {
      const applicationRequest: LoanApplicationRequest = {
        applicantName: 'Bob Wilson',
        propertyAddress: '321 Elm Street, Boston, MA 02101',
        creditScore: 680, // Below threshold
        monthlyIncome: 4000,
        requestedAmount: 180000,
        loanTermMonths: 24
      };

      // Create application
      const createdApp = await loanService.createLoanApplication(applicationRequest);
      expect(createdApp.eligible).toBe(false);

      // Retrieve application
      const retrievedApp = await loanService.getLoanApplication(createdApp.id);
      expect(retrievedApp.id).toBe(createdApp.id);
      expect(retrievedApp.eligible).toBe(false);
    });
  });
});