export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export class ApiError extends Error {
  public statusCode: number;
  public error: string;

  constructor(message: string, statusCode: number = 500, error: string = 'Internal Server Error') {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'Bad Request');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, 'Not Found');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}