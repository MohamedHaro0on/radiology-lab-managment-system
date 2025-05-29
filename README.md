# Radiology Lab Backend

A comprehensive backend system for managing a radiology laboratory, built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Two-factor authentication (2FA)
  - Role-based access control (RBAC)
  - Super admin role with granular privilege management
  - Module-specific operation permissions (view, create, update, delete)

- **Core Modules**
  - Patient Management
  - Doctor Management
  - Appointment Scheduling
  - Radiologist Management
  - Scan Management
  - Stock Management
  - Patient History
  - User Management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/radiology-lab-backend.git
cd radiology-lab-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/radiology-lab
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

## Docker Deployment

1. Build and start the containers:
```bash
docker-compose up -d
```

2. Stop the containers:
```bash
docker-compose down
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA

### Privilege Management (Super Admin Only)

- `GET /api/privileges/users` - Get all users with their privileges
- `GET /api/privileges/users/:userId/privileges` - Get privileges for a specific user
- `POST /api/privileges/users/:userId/privileges` - Grant privileges to a user
- `DELETE /api/privileges/users/:userId/privileges` - Revoke privileges from a user
- `GET /api/privileges/modules` - Get available modules and their operations

### Module Endpoints

#### Patients
- `POST /api/patients` - Create patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

#### Doctors
- `POST /api/doctors` - Create doctor
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `PATCH /api/doctors/:id/availability` - Update doctor availability
- `GET /api/doctors/:id/schedule` - Get doctor schedule

#### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `GET /api/appointments/date-range` - Get appointments by date range

#### Radiologists
- `POST /api/radiologists` - Create radiologist
- `GET /api/radiologists` - Get all radiologists
- `GET /api/radiologists/:id` - Get radiologist by ID
- `PUT /api/radiologists/:id` - Update radiologist
- `DELETE /api/radiologists/:id` - Delete radiologist
- `GET /api/radiologists/stats` - Get radiologist statistics

#### Scans
- `POST /api/scans` - Create scan
- `GET /api/scans` - Get all scans
- `GET /api/scans/:id` - Get scan by ID
- `PUT /api/scans/:id` - Update scan
- `DELETE /api/scans/:id` - Delete scan
- `GET /api/scans/:id/stock-availability` - Check scan stock availability
- `GET /api/scans/stats` - Get scan statistics

#### Stock
- `POST /api/stock` - Create stock item
- `GET /api/stock` - Get all stock items
- `GET /api/stock/:id` - Get stock item by ID
- `PUT /api/stock/:id` - Update stock item
- `DELETE /api/stock/:id` - Delete stock item
- `PATCH /api/stock/:id/quantity` - Update stock quantity
- `GET /api/stock/low-stock` - Get low stock items

#### Patient History
- `POST /api/patient-history` - Create patient history
- `GET /api/patient-history` - Get all patient histories
- `GET /api/patient-history/:id` - Get patient history by ID
- `PUT /api/patient-history/:id` - Update patient history
- `DELETE /api/patient-history/:id` - Delete patient history
- `GET /api/patient-history/patient/:patientId` - Get patient history by patient ID

## Authorization System

The application implements a granular role-based access control (RBAC) system:

### Super Admin
- Has full access to all modules and operations
- Can grant and revoke privileges for other users
- Can manage all users in the system

### Module Privileges
Each module supports four operations:
- `view`: Read access to module data
- `create`: Create new records
- `update`: Modify existing records
- `delete`: Remove records

### Available Modules
1. Patients
2. Doctors
3. Appointments
4. Radiologists
5. Scans
6. Stock
7. Patient History
8. Users

### Privilege Management
Privileges are managed through the `/api/privileges` endpoints:
```json
// Grant privileges example
POST /api/privileges/users/:userId/privileges
{
    "module": "patients",
    "operations": {
        "view": true,
        "create": true,
        "update": false,
        "delete": false
    }
}
```

## Error Handling

The application uses a centralized error handling system with appropriate HTTP status codes and error messages. Common error types include:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Features

   - JWT-based authentication
- Password hashing with bcrypt
   - Two-factor authentication
- CORS protection
   - Rate limiting
- Input validation
- XSS protection
- MongoDB injection protection

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Style

The project follows these coding standards:
- ESLint for code linting
- Prettier for code formatting
- Async/await for asynchronous operations
- Error handling with try/catch blocks
- Proper logging and error tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.