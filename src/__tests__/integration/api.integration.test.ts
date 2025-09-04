import request from 'supertest';
import { app } from '../../app';
import { initializeDatabase, closeDatabase } from '../../database/connection';

describe('API Integration Tests', () => {
  const validApiKey = 'loan-service-secret-key-2024';
  
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Health Check', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'loan-application-service',
        version: '1.0.0'
      });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .post('/loan')
        .send({
          applicantName: 'John Doe',
          propertyAddress: '123 Main St',
          creditScore: 750,
          monthlyIncome: 5000,
          requestedAmount: 200000,
          loanTermMonths: 360
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: expect.stringContaining('API key is required'),
        statusCode: 401
      });
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', 'invalid-key')
        .send({
          applicantName: 'John Doe',
          propertyAddress: '123 Main St',
          creditScore: 750,
          monthlyIncome: 5000,
          requestedAmount: 200000,
          loanTermMonths: 360
        })
        .expect(401);

      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: expect.stringContaining('Invalid API key'),
        statusCode: 401
      });
    });
  });

  describe('Loan Application Workflow', () => {
    it('should process a complete loan application workflow', async () => {
      // Submit loan application
      const submitResponse = await request(app)
        .post('/loan')
        .set('x-api-key', validApiKey)
        .send({
          applicantName: 'John Doe',
          propertyAddress: '558 Carlisle Way Sunnyvale CA 94087',
          creditScore: 720,
          monthlyIncome: 10000,
          requestedAmount: 150000,
          loanTermMonths: 24
        })
        .expect(201);

      expect(submitResponse.body).toEqual({
        id: expect.any(String),
        applicantName: 'John Doe',
        propertyAddress: '558 Carlisle Way Sunnyvale CA 94087',
        creditScore: 720,
        monthlyIncome: 10000,
        requestedAmount: 150000,
        loanTermMonths: 24,
        eligible: true,
        reason: 'Passed all checks',
        crimeGrade: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      const loanId = submitResponse.body.id;

      // Retrieve loan application
      const retrieveResponse = await request(app)
        .get(`/loan/${loanId}`)
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(retrieveResponse.body).toEqual(submitResponse.body);
    });

    it('should reject loan application with low credit score', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', validApiKey)
        .send({
          applicantName: 'Jane Smith',
          propertyAddress: '123 Main St',
          creditScore: 650, // Below 700 threshold
          monthlyIncome: 5000,
          requestedAmount: 200000,
          loanTermMonths: 360
        })
        .expect(201);

      expect(response.body.eligible).toBe(false);
      expect(response.body.reason).toContain('Credit score must be at least 700');
    });

    it('should reject loan application with insufficient income', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', validApiKey)
        .send({
          applicantName: 'Bob Johnson',
          propertyAddress: '123 Main St',
          creditScore: 750,
          monthlyIncome: 2000, // Insufficient for the loan amount
          requestedAmount: 200000,
          loanTermMonths: 120
        })
        .expect(201);

      expect(response.body.eligible).toBe(false);
      expect(response.body.reason).toContain('Insufficient monthly income');
    });

    it('should handle invalid loan application data', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', validApiKey)
        .send({
          applicantName: '', // Invalid empty name
          propertyAddress: '123 Main St',
          creditScore: 'invalid', // Invalid type
          monthlyIncome: -1000, // Invalid negative amount
          requestedAmount: 200000,
          loanTermMonths: 360
        })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 404 for non-existent loan application', async () => {
      const response = await request(app)
        .get('/loan/non-existent-id')
        .set('x-api-key', validApiKey)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Loan application not found',
        statusCode: 404
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .set('x-api-key', validApiKey)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: expect.stringContaining('Route GET /unknown-route not found'),
        statusCode: 404
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/loan')
        .set('x-api-key', validApiKey)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });
});