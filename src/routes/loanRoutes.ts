import { Router } from 'express';
import { LoanController } from '../controllers/LoanController';
import { LoanService } from '../services/LoanService';
import { LoanRepository } from '../repositories/LoanRepository';
import { EligibilityService } from '../services/EligibilityService';
import { CrimeAgentService } from '../services/CrimeAgentService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// Create service instances
const loanRepository = new LoanRepository();
const eligibilityService = new EligibilityService();
const crimeAgentService = new CrimeAgentService();
const loanService = new LoanService(loanRepository, eligibilityService, crimeAgentService);
const loanController = new LoanController(loanService);
const authMiddleware = new AuthMiddleware();

// Loan application routes (with authentication)
router.post('/loan', authMiddleware.authenticate, loanController.createLoan.bind(loanController));
router.get('/loan/:id', authMiddleware.authenticate, loanController.getLoan.bind(loanController));

export { router as loanRoutes };

export function createRoutes(): Router {
  return router;
}