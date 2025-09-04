import { Request, Response } from 'express';
import { LoanController } from '../../controllers/LoanController';
import { LoanService } from '../../services/LoanService';
import { LoanApplicationRequest, LoanApplicationResponse } from '../../models/LoanApplication';
import { ValidationError, NotFoundError } from '../../models/ErrorResponse';

describe('LoanController', () => {
  let loanController: LoanController;
  let mockLoanService: jest.Mocked<LoanService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockLoanService = {
      createLoanApplication: jest.fn(),
      getLoanApplication: jest.fn(),
      getAllLoanApplications: jest.fn(),
      processApplicationWithMockCrimeGrade: jest.fn(),
    } as unknown as jest.Mocked<LoanService>;
    loanController = new LoanController(mockLoanService);
    
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('createLoan', () => {
    const validLoanRequest: LoanApplicationRequest = {
      applicantName: 'John Doe',
      propertyAddress: '123 Main Street, Anytown, CA 12345',
      creditScore: 750,
      monthlyIncome: 8000,
      requestedAmount: 150000,
      loanTermMonths: 24
    };

    const mockLoanResponse: LoanApplicationResponse = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...validLoanRequest,
      eligible: true,
      reason: 'Passed all checks',
      crimeGrade: 'A'
    };

    it('should create loan application successfully', async () => {
      mockRequest.body = validLoanRequest;
      mockLoanService.createLoanApplication.mockResolvedValue(mockLoanResponse);

      await loanController.createLoan(mockRequest as Request, mockResponse as Response);

      expect(mockLoanService.createLoanApplication).toHaveBeenCalledWith(validLoanRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoanResponse);
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { invalidData: true };

      await loanController.createLoan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          statusCode: 400
        })
      );
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        applicantName: 'John Doe'
        // Missing other required fields
      };

      await loanController.createLoan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          statusCode: 400
        })
      );
    });

    it('should handle service errors', async () => {
      mockRequest.body = validLoanRequest;
      mockLoanService.createLoanApplication.mockRejectedValue(new Error('Database connection failed'));

      await loanController.createLoan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Database connection failed',
        statusCode: 500
      });
    });
  });

  describe('getLoan', () => {
    const mockLoanResponse: LoanApplicationResponse = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      applicantName: 'Jane Smith',
      propertyAddress: '456 Oak Avenue, Springfield, IL 62701',
      creditScore: 720,
      monthlyIncome: 6000,
      requestedAmount: 120000,
      loanTermMonths: 30,
      eligible: true,
      reason: 'Passed all checks',
      crimeGrade: 'B'
    };

    it('should retrieve loan application successfully', async () => {
      const loanId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.params = { id: loanId };
      mockLoanService.getLoanApplication.mockResolvedValue(mockLoanResponse);

      await loanController.getLoan(mockRequest as Request, mockResponse as Response);

      expect(mockLoanService.getLoanApplication).toHaveBeenCalledWith(loanId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoanResponse);
    });

    it('should handle missing loan ID parameter', async () => {
      mockRequest.params = {};

      await loanController.getLoan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          message: 'Loan ID is required',
          statusCode: 400
        })
      );
    });

    it('should handle loan not found', async () => {
      const loanId = 'non-existent-id';
      mockRequest.params = { id: loanId };
      mockLoanService.getLoanApplication.mockRejectedValue(
        new NotFoundError(`Loan application with id ${loanId} not found`)
      );

      await loanController.getLoan(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: `Loan application with id ${loanId} not found`,
        statusCode: 404
      });
    });
  });

  describe('getAllLoans', () => {
    it('should retrieve all loan applications successfully', async () => {
      const mockLoansResponse: LoanApplicationResponse[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          applicantName: 'John Doe',
          propertyAddress: '123 Main Street',
          creditScore: 750,
          monthlyIncome: 8000,
          requestedAmount: 150000,
          loanTermMonths: 24,
          eligible: true,
          reason: 'Passed all checks',
          crimeGrade: 'A'
        },
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          applicantName: 'Jane Smith',
          propertyAddress: '456 Oak Avenue',
          creditScore: 680,
          monthlyIncome: 4000,
          requestedAmount: 180000,
          loanTermMonths: 24,
          eligible: false,
          reason: 'Credit score too low',
          crimeGrade: 'B'
        }
      ];

      mockLoanService.getAllLoanApplications.mockResolvedValue(mockLoansResponse);

      await loanController.getAllLoans(mockRequest as Request, mockResponse as Response);

      expect(mockLoanService.getAllLoanApplications).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLoansResponse);
    });

    it('should handle service errors when retrieving all loans', async () => {
      mockLoanService.getAllLoanApplications.mockRejectedValue(new Error('Database error'));

      await loanController.getAllLoans(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Database error',
        statusCode: 500
      });
    });
  });
});