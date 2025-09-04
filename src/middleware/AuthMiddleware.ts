import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../models/ErrorResponse';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export class AuthMiddleware {
  private static readonly API_KEY_HEADER = 'x-api-key';
  private validApiKey: string;

  constructor(apiKey?: string) {
    this.validApiKey = apiKey || process.env.API_KEY || 'default-secret-key';
    
    if (!apiKey && !process.env.API_KEY) {
      console.warn('Warning: Using default API key. Set API_KEY environment variable for production.');
    }
  }

  authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const providedApiKey = req.headers[AuthMiddleware.API_KEY_HEADER] as string;

      if (!providedApiKey) {
        throw new UnauthorizedError('API key is required. Please provide a valid API key in the x-api-key header.');
      }

      if (providedApiKey !== this.validApiKey) {
        throw new UnauthorizedError('Invalid API key. Please provide a valid API key.');
      }

      // Mark request as authenticated
      req.isAuthenticated = true;
      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(error.statusCode).json({
          error: error.error,
          message: error.message,
          statusCode: error.statusCode
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication failed due to server error',
          statusCode: 500
        });
      }
    }
  };

  // Utility method for testing
  getValidApiKey(): string {
    return this.validApiKey;
  }

  // Method to update API key (useful for testing or key rotation)
  updateApiKey(newApiKey: string): void {
    this.validApiKey = newApiKey;
  }
}

// Factory function for creating middleware instance
export function createAuthMiddleware(apiKey?: string): AuthMiddleware {
  return new AuthMiddleware(apiKey);
}

// Express middleware function for direct use
export function requireApiKey(apiKey?: string) {
  const authMiddleware = new AuthMiddleware(apiKey);
  return authMiddleware.authenticate;
}