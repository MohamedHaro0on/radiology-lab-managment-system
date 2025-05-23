# Radiology Lab Backend

A robust backend system for managing a radiology laboratory, built with Node.js, Express, and MongoDB.

## Project Structure

```
radiology-lab-backend/
├── config/                 # Configuration files
│   └── index.js           # Environment configuration
├── controllers/           # Route controllers
│   ├── authController.js
│   ├── appointmentController.js
│   ├── doctorController.js
│   ├── patientController.js
│   ├── patientHistoryController.js
│   └── stockController.js
├── middleware/           # Custom middleware
│   ├── auth.js          # Authentication middleware
│   └── validate.js      # Request validation middleware
├── models/              # Mongoose models
│   ├── Appointment.js
│   ├── Doctor.js
│   ├── Patient.js
│   ├── PatientHistory.js
│   ├── Stock.js
│   └── User.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── appointmentRoutes.js
│   ├── doctorRoutes.js
│   ├── patientRoutes.js
│   ├── patientHistoryRoutes.js
│   └── stockRoutes.js
├── utils/              # Utility functions
│   ├── errorHandler.js
│   └── generateSecrets.js
├── validations/        # Joi validation schemas
│   ├── appointmentValidation.js
│   ├── doctorValidation.js
│   ├── patientValidation.js
│   ├── patientHistoryValidation.js
│   └── stockValidation.js
├── scripts/           # Utility scripts
│   ├── createAdmin.js
│   └── inspectUser.js
├── .env               # Environment variables
├── .env.example       # Example environment variables
├── package.json
└── README.md
```

## Database Schemas

### User Schema
- `username`: String (required, unique)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: String (enum: ['admin', 'manager', 'doctor', 'staff'])
- `isActive`: Boolean
- `twoFactorEnabled`: Boolean
- `twoFactorSecret`: String
- `lastLogin`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Doctor Schema
- `firstName`: String (required)
- `lastName`: String (required)
- `email`: String (required, unique)
- `phoneNumber`: String (required)
- `specialization`: String (required)
- `licenseNumber`: String (required, unique)
- `isActive`: Boolean
- `patientsCount`: Number (default: 0)
- `referralCount`: Number (default: 0)
- `user`: ObjectId (ref: 'User')
- `createdAt`: Date
- `updatedAt`: Date

### Patient Schema
- `firstName`: String (required)
- `lastName`: String (required)
- `email`: String (required, unique)
- `phoneNumber`: String (required)
- `dateOfBirth`: Date (required)
- `gender`: String (enum: ['male', 'female', 'other'])
- `address`: Object
  - `street`: String
  - `city`: String
  - `state`: String
  - `zipCode`: String
  - `country`: String
- `referredBy`: ObjectId (ref: 'Doctor')
- `createdAt`: Date
- `updatedAt`: Date

### Patient History Schema
- `patientId`: ObjectId (ref: 'Patient', required)
- `doctorId`: ObjectId (ref: 'Doctor', required)
- `date`: Date (required)
- `diagnosis`: String (required)
- `treatment`: String (required)
- `notes`: String
- `createdAt`: Date
- `updatedAt`: Date

### Appointment Schema
- `patient`: ObjectId (ref: 'Patient', required)
- `doctor`: ObjectId (ref: 'Doctor', required)
- `appointmentDate`: Date (required)
- `timeSlot`: Object (required)
  - `start`: String (HH:MM format)
  - `end`: String (HH:MM format)
- `type`: String (enum: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'])
- `status`: String (enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
- `priority`: String (enum: ['routine', 'urgent', 'emergency'])
- `notes`: String
- `referralSource`: String
- `createdBy`: ObjectId (ref: 'User')
- `updatedBy`: ObjectId (ref: 'User')
- `createdAt`: Date
- `updatedAt`: Date

### Stock Schema
- `itemName`: String (required)
- `category`: String (enum: ['X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other'])
- `quantity`: Number (required, min: 0)
- `unit`: String (enum: ['Box', 'Piece', 'Pack', 'Bottle', 'Kit'])
- `minimumQuantity`: Number (required, min: 0)
- `supplier`: Object
  - `name`: String (required)
  - `contactPerson`: String
  - `phoneNumber`: String
  - `email`: String
- `expiryDate`: Date
- `batchNumber`: String
- `location`: String (required)
- `notes`: String
- `lastUpdatedBy`: ObjectId (ref: 'User')
- `createdAt`: Date
- `updatedAt`: Date

## API Features

### Pagination
All list endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sortBy`: Field to sort by (varies by endpoint)
- `sortOrder`: Sort order ('asc' or 'desc', default varies by endpoint)

Example paginated response:
```json
{
    "status": "success",
    "data": [...],
    "pagination": {
        "total": 100,      // Total number of items
        "page": 1,         // Current page
        "limit": 10,       // Items per page
        "pages": 10,       // Total number of pages
        "hasNext": true,   // Whether there is a next page
        "hasPrev": false   // Whether there is a previous page
    }
}
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user (public endpoint for testing)
- `POST /login` - Login user (requires 2FA)
- `GET /profile` - Get user profile (requires auth)
- `PATCH /profile` - Update user profile (requires auth)
- `POST /2fa/setup` - Setup 2FA (requires auth)
- `POST /2fa/verify` - Verify 2FA token (requires auth)
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID (admin only)

### Patients (`/api/patients`)
- `POST /` - Create new patient (admin/manager only)
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "address": {
      "street": "123 Main St",
      "city": "City",
      "state": "State",
      "zipCode": "12345",
      "country": "Country"
    },
    "referredBy": "doctor_id_here"  // Optional
  }
  ```
- `GET /` - Get all patients (with filtering and pagination)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10, max: 100)
    - `search`: Search in name, email, or phone
    - `gender`: Filter by gender ('male', 'female', 'other')
    - `sortBy`: Sort field (default: 'createdAt')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'desc')
  - Returns paginated list with populated referredBy field
- `GET /:id` - Get patient by ID
- `PATCH /:id` - Update patient (admin/manager only)
- `DELETE /:id` - Delete patient (admin only)

### Doctors (`/api/doctors`)
- `POST /` - Create new doctor (admin only)
- `GET /` - Get all doctors (with filtering and pagination)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10, max: 100)
    - `search`: Search in name or specialization
    - `specialization`: Filter by specialization
    - `isActive`: Filter by active status
    - `sortBy`: Sort field (default: 'name')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'asc')
  - Returns paginated list
- `GET /:id` - Get doctor by ID
- `PATCH /:id` - Update doctor (admin only)
- `DELETE /:id` - Delete doctor (admin only)
- `PATCH /:id/availability` - Update doctor availability
- `GET /:id/schedule` - Get doctor's schedule

### Appointments (`/api/appointments`)
- `POST /` - Create new appointment
  ```json
  {
    "patientId": "patient_id_here",
    "doctorId": "doctor_id_here",
    "appointmentDate": "2024-03-20T10:00:00Z",
    "timeSlot": {
      "start": "10:00",
      "end": "11:00"
    },
    "type": "X-Ray",
    "priority": "routine",
    "notes": "Optional notes",
    "referralSource": "Optional referral source"
  }
  ```
- `GET /` - Get all appointments (with filtering and pagination)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `patient`: Filter by patient ID
    - `doctor`: Filter by doctor ID
    - `status`: Filter by status
    - `type`: Filter by appointment type
    - `priority`: Filter by priority
    - `startDate`: Filter by start date
    - `endDate`: Filter by end date
    - `sortBy`: Sort field (default: 'appointmentDate')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'asc')
  - Returns paginated list with populated references
- `GET /:id` - Get appointment by ID
- `PATCH /:id` - Update appointment details
- `DELETE /:id` - Delete appointment (only scheduled appointments)
- `PATCH /:id/status` - Update appointment status
  ```json
  {
    "status": "completed",
    "diagnosis": "Required when completing appointment",
    "treatment": "Required when completing appointment",
    "notes": "Optional additional notes"
  }
  ```
- `GET /date-range` - Get appointments by date range
  - Query Parameters:
    - `startDate`: Start date (required)
    - `endDate`: End date (required)
    - `doctor`: Filter by doctor ID
    - `status`: Filter by status
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `sortBy`: Sort field (default: 'appointmentDate')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'asc')
  - Returns paginated list with populated references

### Stock (`/api/stock`)
- `POST /` - Add new stock item
- `GET /` - Get all stock items (with filtering and pagination)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `category`: Filter by category
    - `search`: Search in item name
    - `sortBy`: Sort field (default: 'itemName')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'asc')
  - Returns paginated list
- `GET /:id` - Get stock item by ID
- `PATCH /:id` - Update stock item
- `DELETE /:id` - Delete stock item
- `PATCH /:id/quantity` - Update stock quantity
- `GET /low-stock` - Get low stock items (with pagination)

### Patient History (`/api/patient-history`)
- `POST /` - Create new patient history record (admin/doctor only)
  ```json
  {
    "patientId": "patient_id_here",
    "doctorId": "doctor_id_here",
    "date": "2024-03-20T10:00:00Z",
    "diagnosis": "Patient diagnosis",
    "treatment": "Prescribed treatment",
    "notes": "Additional notes"
  }
  ```
- `GET /` - Get all patient history records (with filtering and pagination)
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
    - `patientId`: Filter by patient
    - `doctorId`: Filter by doctor
    - `date`: Filter by date
    - `sortBy`: Sort field (default: 'date')
    - `sortOrder`: Sort order ('asc' or 'desc', default: 'desc')
  - Returns paginated list with populated references
- `GET /:id` - Get patient history record by ID
- `PATCH /:id` - Update patient history record (admin/doctor only)
- `DELETE /:id` - Delete patient history record (admin/doctor only)

## Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Two-factor authentication
   - Password hashing with bcrypt

2. **Error Handling**
   - Custom error classes
   - Global error handler
   - Validation error handling
   - Async error handling with express-async-handler

3. **Data Validation**
   - Request validation using Joi
   - Schema validation using Mongoose
   - Custom validation middleware

4. **Security**
   - Environment variable management
   - Rate limiting
   - Input sanitization
   - Secure password storage

5. **API Features**
   - RESTful API design
   - Pagination
   - Filtering
   - Sorting
   - Search functionality
   - Data population
   - Audit trails

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file based on `.env.example`
4. Generate secrets: `node utils/generateSecrets.js`
5. Start the server: `npm start`

## Environment Variables

Required environment variables (see `.env.example` for details):
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration time
- `BCRYPT_SALT_ROUNDS` - Bcrypt salt rounds
- `EMAIL_SERVICE` - Email service configuration
- `EMAIL_USER` - Email service username
- `EMAIL_PASS` - Email service password

## Development

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`

## Production

For production deployment:
1. Set `NODE_ENV=production`
2. Use a proper MongoDB cluster
3. Set up proper email service
4. Configure proper logging
5. Set up monitoring
6. Use HTTPS
7. Implement rate limiting
8. Set up proper backup strategy