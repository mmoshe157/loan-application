import request from 'supertest';
import express from 'express';
import { createRoutes } from '../../routes';
import { LoanController } from '../../controllers/LoanController';
import { AuthMiddleware } from '../../middleware/AuthMiddleware';
import { LoanService } from '../../services/LoanService';
import { EligibilityService } from '../../services/EligibilityService';
import { CrimeAgentService } from '../../services/CrimeAgentService';
import { LoanRepository } from '../../repositories/LoanRepository';
import { Database } from '../../database/connection';

describe('Loan Routes Integration', () => {
  let app: express.Application;
  let database: Database;
  const testApiKey = 'test-api-key-123';

  beforeAll(async () => {
    // Set up in-memory database for testing
    database = new Database(':memory:');
    await database.initialize();

    // Create service instances
    const loanRepository = new LoanRepository(database);
    const eligibilityService = new EligibilityService();
    const crimeAgentService = new CrimeAgentService();
    const loanService = new LoanService(loanRepository, eligibilityService, crimeAgentService);
    const loanController = new LoanController(loanService);
    const authMiddleware = new AuthMiddleware(testApiKey);

    // Set up Express app
    app = express();
    app.use(express.json());
    app.use('/', createRoutes(loanController, authMiddleware));
  });

  afterAll(async () => {
    await database.close();
  });

  describe('POST /loan', () => {
    const validLoanApplication = {
      applicantName: 'John Doe',
      propertyAddress: '123 Main Street, Anytown, CA 12345',
      creditScore: 750,
      monthlyIncome: 8000,
      requestedAmount: 150000,
      loanTermMonths: 24
    };

    it('should create loan application with valid API key', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', testApiKey)
        .send(validLoanApplication)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        applicantName: validLoanApplication.applicantName,
        propertyAddress: validLoanApplication.propertyAddress,
        creditScore: validLoanApplication.creditScore,
        monthlyIncome: validLoanApplication.monthlyIncome,
        requestedAmount: validLoanApplication.requestedAmount,
        loanTermMonths: validLoanApplication.loanTermMonths,
        eligible: expect.any(Boolean),
        reason: expect.any(String),
        crimeGrade: expect.stringMatching(/^[A-F]$/)
      });
    });

    it('should reject request without API key', async () => {
      const response = await request(app)
        .post('/loan')
        .send(validLoanApplication)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.stringContaining('API key is required'),
        statusCode: 401
      });
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', 'invalid-key')
        .send(validLoanApplication)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: expect.stringContaining('Invalid API key'),
        statusCode: 401
      });
    });

    it('should reject request with invalid data', async () => {
      const invalidApplication = {
        applicantName: 'John Doe',
        // Missing required fields
      };

      const response = await request(app)
        .post('/loan')
        .set('x-api-key', testApiKey)
        .send(invalidApplication)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Bad Request',
        statusCode: 400
      });
    });

    it('should handle ineligible application correctly', async () => {
      const ineligibleApplication = {
        ...validLoanApplication,
        creditScore: 650 // Below threshold
      };

      const response = await request(app)
        .post('/loan')
        .set('x-api-key', testApiKey)
        .send(ineligibleApplication)
        .expect(201);

      expect(response.body.eligible).toBe(false);
      expect(response.body.reason).toContain('Credit score too low');
    });
  });

  describe('GET /loan/:id', () => {
    let createdLoanId: string;

    beforeAll(async () => {
      // Create a loan application for testing retrieval
      const loanApplication = {
        applicantName: 'Jane Smith',
        propertyAddress: '456 Oak Avenue, Springfield, IL 62701',
        creditScore: 720,
        monthlyIncome: 6000,
        requestedAmount: 120000,
        loanTermMonths: 30
      };

      const createResponse = await request(app)
        .post('/loan')
        .set('x-api-key', testApiKey)
        .send(loanApplication);

      createdLoanId = createResponse.body.id;
    });

    it('should retrieve loan application with valid API key', async () => {
      const response = await request(app)
        .get(`/loan/${createdLoanId}`)
        .set('x-api-key', testApiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdLoanId,
        applicantName: 'Jane Smith',
        propertyAddress: '456 Oak Avenue, Springfield, IL 62701',
        creditScore: 720,
        monthlyIncome: 6000,
        requestedAmount: 120000,
        loanTermMonths: 30,
        eligible: expect.any(Boolean),
        reason: expect.any(String),
        crimeGrade: expect.stringMatching(/^[A-F]$/)
      });
    });

    it('should reject request without API key', async () => {
      const response = await request(app)
        .get(`/loan/${createdLoanId}`)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        statusCode: 401
      });
    });

    it('should return 404 for non-existent loan', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/loan/${nonExistentId}`)
        .set('x-api-key', testApiKey)
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        statusCode: 404
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        timestamp: expect.any(String),
        service: 'loan-application-service'
      });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: expect.stringContaining('Route GET /non-existent-route not found'),
        statusCode: 404
      });
    });
  });
});