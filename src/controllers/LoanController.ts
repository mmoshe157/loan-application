import { Request, Response } from 'express';
import { LoanService } from '../services/LoanService';
import { validateLoanApplicationSafe } from '../utils/validation';

export class LoanController {
  private loanService: LoanService;

  constructor(loanService: LoanService) {
    this.loanService = loanService;
  }

  createLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validation = validateLoanApplicationSafe(req.body);
      
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Validation failed: ${validation.errors.join(', ')}`,
          statusCode: 400
        });
        return;
      }

      // Sanitize and process loan application
      const validatedData = {
        applicantName: String(req.body.applicantName).trim(),
        propertyAddress: String(req.body.propertyAddress).trim(),
        creditScore: Number(req.body.creditScore),
        monthlyIncome: Number(req.body.monthlyIncome),
        requestedAmount: Number(req.body.requestedAmount),
        loanTermMonths: Number(req.body.loanTermMonths)
      };

      const result = await this.loanService.processLoanApplication(validatedData);

      // Return success response
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Loan ID is required',
          statusCode: 400
        });
        return;
      }

      const result = await this.loanService.getLoanApplication(id);
      
      if (!result) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Loan application not found',
          statusCode: 404
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAllLoans = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.loanService.getAllLoanApplications();
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    console.error('Controller error:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        statusCode: 500
      });
    }
  }
}