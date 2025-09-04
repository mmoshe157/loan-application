import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { loanRoutes } from './routes/loanRoutes';
import { initializeDatabase } from './database/connection';
import { ErrorResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(json({ limit: '10mb' }));

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Loan Application Service',
    service: 'loan-application-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      submitLoan: 'POST /loan (requires x-api-key header)',
      getLoan: 'GET /loan/:id (requires x-api-key header)'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'loan-application-service',
    version: '1.0.0'
  });
});

// API routes
app.use('/', loanRoutes);

// 404 handler
app.use('*', (req, res) => {
  const error: ErrorResponse = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404
  };
  res.status(404).json(error);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    const error: ErrorResponse = {
      error: 'Bad Request',
      message: 'Invalid JSON format in request body',
      statusCode: 400
    };
    res.status(400).json(error);
    return;
  }
  
  const error: ErrorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message || 'Unknown error',
    statusCode: 500
  };
  
  res.status(500).json(error);
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Loan Application Service is running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔑 API endpoints require x-api-key header`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          const { closeDatabase } = await import('./database/connection');
          await closeDatabase();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app };