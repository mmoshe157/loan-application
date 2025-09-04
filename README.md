# Loan Application Service

A Node.js/TypeScript backend service that processes loan applications and determines eligibility based on business rules, including integration with crime data analysis.

## Features

- **Loan Application Processing**: Submit and retrieve loan applications via REST API
- **Automated Eligibility Evaluation**: Business rules-based approval/rejection
- **Crime Data Integration**: AI agent that analyzes property location crime rates
- **Secure API**: API key-based authentication
- **Comprehensive Testing**: Unit and integration tests with high coverage
- **Docker Support**: Containerized deployment with health checks

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite
- **Testing**: Jest + Supertest
- **Containerization**: Docker

## Quick Start

### Using Docker (Recommended)

1. **Build and run the service:**
   ```bash
   docker build -t loan-api .
   docker run -p 3000:3000 loan-api
   ```

2. **Or use Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Test the service:**
   ```bash
   curl -X GET http://localhost:3000/health
   ```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## API Documentation

### Authentication

All API endpoints (except `/health`) require an API key in the `x-api-key` header.

**Default API Key**: `loan-service-secret-key-2024`

### Endpoints

#### Health Check
```http
GET /health
```
Returns service status (no authentication required).

#### Submit Loan Application
```http
POST /loan
Content-Type: application/json
x-api-key: your-api-key

{
  "applicantName": "John Doe",
  "propertyAddress": "558 Carlisle Way Sunnyvale CA 94087",
  "creditScore": 720,
  "monthlyIncome": 6500,
  "requestedAmount": 150000,
  "loanTermMonths": 24
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "applicantName": "John Doe",
  "propertyAddress": "558 Carlisle Way Sunnyvale CA 94087",
  "creditScore": 720,
  "monthlyIncome": 6500,
  "requestedAmount": 150000,
  "loanTermMonths": 24,
  "eligible": true,
  "reason": "Passed all checks",
  "crimeGrade": "A"
}
```

#### Retrieve Loan Application
```http
GET /loan/:id
x-api-key: your-api-key
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "applicantName": "John Doe",
  "propertyAddress": "558 Carlisle Way Sunnyvale CA 94087",
  "creditScore": 720,
  "monthlyIncome": 6500,
  "requestedAmount": 150000,
  "loanTermMonths": 24,
  "eligible": true,
  "reason": "Passed all checks",
  "crimeGrade": "A"
}
```

## Business Rules

An applicant is eligible for a loan if **ALL** of the following criteria are met:

1. **Credit Score**: Must be ≥ 700
2. **Income Requirement**: Monthly income must be > (requestedAmount / loanTermMonths) × 1.5
3. **Crime Grade**: Property location crime grade must not be "F"

### Crime Grade Integration

The service integrates with crime data sources to evaluate property location risk:
- Grades range from A (safest) to F (highest crime)
- Applications with grade "F" locations are automatically rejected
- The AI agent normalizes addresses and caches results for performance

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Categories

- **Unit Tests**: Individual component testing (services, repositories, controllers)
- **Integration Tests**: Full API workflow testing with real database
- **Coverage**: Comprehensive test coverage for all business logic

## Architecture

The service follows a layered architecture pattern:

```
┌─────────────────┐
│   API Layer     │ ← Express routes, middleware, validation
├─────────────────┤
│  Service Layer  │ ← Business logic, eligibility evaluation
├─────────────────┤
│Repository Layer │ ← Data access abstraction
├─────────────────┤
│   Data Layer    │ ← SQLite database
└─────────────────┘

External Integration:
┌─────────────────┐
│  Crime AI Agent │ ← Crime data analysis
└─────────────────┘
```

### Key Components

- **LoanService**: Orchestrates loan processing workflow
- **EligibilityService**: Implements business rules for loan approval
- **CrimeAgentService**: Integrates with external crime data sources
- **LoanRepository**: Handles database operations
- **AuthMiddleware**: API key validation and security

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | Secret key for API authentication | `loan-service-secret-key-2024` |
| `DATABASE_URL` | SQLite database file path | `./database.sqlite` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |

### Docker Environment

The Docker container uses the following defaults:
- Port: 3000
- Database: `/app/data/database.sqlite` (persisted volume)
- User: Non-root `nodejs` user for security
- Health check: Automated endpoint monitoring

## Development

### Project Structure
```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── repositories/    # Data access layer
├── models/          # TypeScript interfaces
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── database/        # Database connection and setup
├── utils/           # Utility functions
└── __tests__/       # Test files
```

### Adding New Features

1. **Define Models**: Add TypeScript interfaces in `src/models/`
2. **Implement Services**: Add business logic in `src/services/`
3. **Create Controllers**: Add HTTP handlers in `src/controllers/`
4. **Add Routes**: Register endpoints in `src/routes/`
5. **Write Tests**: Add comprehensive tests in `src/__tests__/`

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Jest**: Testing framework with coverage reporting
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Deployment

### Production Deployment

1. **Build Docker image:**
   ```bash
   docker build -t loan-api:latest .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e API_KEY=your-production-key \
     -e NODE_ENV=production \
     -v loan_data:/app/data \
     --name loan-api \
     loan-api:latest
   ```

3. **Monitor health:**
   ```bash
   curl http://localhost:3000/health
   ```

### Security Considerations

- **API Key**: Change default API key in production
- **CORS**: Configure appropriate CORS origins
- **HTTPS**: Use reverse proxy (nginx/Apache) for SSL termination
- **Rate Limiting**: Consider adding rate limiting middleware
- **Input Validation**: All inputs are validated and sanitized

## Troubleshooting

### Common Issues

1. **Database Permission Errors**
   - Ensure database directory is writable
   - Check Docker volume permissions

2. **API Key Authentication Failures**
   - Verify `x-api-key` header is included
   - Check API key matches configured value

3. **Crime Data Service Unavailable**
   - Service gracefully degrades with fallback grades
   - Check logs for external service errors

### Logs

The service provides structured logging:
- Request logging with timestamps
- Error logging with stack traces
- Service status and health information

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the test cases for usage examples
3. Examine the source code documentation