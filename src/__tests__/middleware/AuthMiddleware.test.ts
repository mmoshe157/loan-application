import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '../../middleware/AuthMiddleware';
import { UnauthorizedError } from '../../models/ErrorResponse';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware('test-api-key');
    
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid API key', () => {
      mockRequest.headers = { 'x-api-key': 'test-api-key' };

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.isAuthenticated).toBe(true);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should reject request with missing API key', () => {
      mockRequest.headers = {};

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.isAuthenticated).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'API key is required. Please provide a valid API key in the x-api-key header.',
        statusCode: 401
      });
    });

    it('should reject request with invalid API key', () => {
      mockRequest.headers = { 'x-api-key': 'invalid-key' };

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.isAuthenticated).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid API key. Please provide a valid API key.',
        statusCode: 401
      });
    });

    it('should reject request with empty API key', () => {
      mockRequest.headers = { 'x-api-key': '' };

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.isAuthenticated).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle case-sensitive header names correctly', () => {
      mockRequest.headers = { 'X-API-KEY': 'test-api-key' };

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Should fail because Express headers are case-insensitive but our check is for lowercase
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should work with lowercase header name', () => {
      mockRequest.headers = { 'x-api-key': 'test-api-key' };

      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.isAuthenticated).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('constructor and configuration', () => {
    it('should use provided API key', () => {
      const customKey = 'custom-secret-key';
      const middleware = new AuthMiddleware(customKey);
      
      expect(middleware.getValidApiKey()).toBe(customKey);
    });

    it('should use environment variable when no key provided', () => {
      const originalEnv = process.env.API_KEY;
      process.env.API_KEY = 'env-api-key';
      
      const middleware = new AuthMiddleware();
      expect(middleware.getValidApiKey()).toBe('env-api-key');
      
      // Restore original environment
      process.env.API_KEY = originalEnv;
    });

    it('should use default key when no key or env var provided', () => {
      const originalEnv = process.env.API_KEY;
      delete process.env.API_KEY;
      
      const middleware = new AuthMiddleware();
      expect(middleware.getValidApiKey()).toBe('default-secret-key');
      
      // Restore original environment
      process.env.API_KEY = originalEnv;
    });
  });

  describe('utility methods', () => {
    it('should allow updating API key', () => {
      const newKey = 'updated-api-key';
      authMiddleware.updateApiKey(newKey);
      
      expect(authMiddleware.getValidApiKey()).toBe(newKey);
      
      // Test that authentication works with new key
      mockRequest.headers = { 'x-api-key': newKey };
      authMiddleware.authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockRequest.isAuthenticated).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Create a new mock request that throws an error when accessing headers
      const errorRequest = {
        get headers() {
          throw new Error('Unexpected error');
        }
      } as unknown;

      authMiddleware.authenticate(
        errorRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Authentication failed due to server error',
        statusCode: 500
      });
    });
  });
});