# Radiology Lab Backend

A robust backend system for managing a radiology laboratory, built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control
  - Privilege management system

- **Patient Management**
  - Patient registration and profile management
  - Medical history tracking
  - Appointment scheduling

- **Doctor Management**
  - Doctor registration and profiles
  - Specialization tracking
  - Referral management

- **Appointment System**
  - Appointment scheduling
  - Status tracking (scheduled, confirmed, in-progress, completed, cancelled)
  - Multiple scans per appointment
  - Payment tracking

- **Scan Management**
  - Scan categories with pricing
  - Multiple scans per appointment
  - Radiologist assignment
  - Results and findings management

- **Inventory Management**
  - Stock tracking
  - Low stock alerts
  - Expiry date monitoring
  - Supplier management

- **Reporting**
  - Appointment statistics
  - Revenue tracking
  - Inventory reports
  - Doctor performance metrics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Joi
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

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
JWT_EXPIRES_IN=7d
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PATCH /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `PATCH /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/stats/top-referring` - Get top referring doctors

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `GET /api/appointments/date-range` - Get appointments by date range

### Scans
- `GET /api/scans` - Get all scans
- `POST /api/scans` - Create new scan
- `GET /api/scans/:id` - Get scan by ID
- `PATCH /api/scans/:id` - Update scan
- `DELETE /api/scans/:id` - Delete scan
- `GET /api/scans/doctor/:doctorId` - Get scans by doctor
- `GET /api/scans/patient/:patientId` - Get scans by patient

### Scan Categories
- `GET /api/scan-categories` - Get all scan categories
- `POST /api/scan-categories` - Create new category
- `GET /api/scan-categories/:id` - Get category by ID
- `PATCH /api/scan-categories/:id` - Update category
- `DELETE /api/scan-categories/:id` - Delete category
- `GET /api/scan-categories/stats` - Get category statistics

### Stock
- `GET /api/stock` - Get all stock items
- `POST /api/stock` - Create new stock item
- `GET /api/stock/:id` - Get stock item by ID
- `PATCH /api/stock/:id` - Update stock item
- `DELETE /api/stock/:id` - Delete stock item
- `GET /api/stock/low` - Get low stock items
- `GET /api/stock/expired` - Get expired items

## Data Models

### Patient
- Basic info (name, contact, DOB, gender)
- Medical history
- Insurance details
- Referred by (doctor)

### Doctor
- Basic info (name, contact, email)
- Specialization
- License number
- Qualifications
- Referral count

### Appointment
- Patient reference
- Doctor reference
- Date and time
- Status
- Scans array
- Payment status
- Total amount

### Scan
- Category reference
- Patient reference
- Radiologist reference
- Status
- Results
- Notes
- Items used

### ScanCategory
- Name
- Description
- Price
- Duration
- Preparation instructions
- Active status

### Stock
- Item name
- Category
- Quantity
- Unit
- Minimum quantity
- Supplier info
- Expiry date
- Location
- Last updated by

## Error Handling

The API uses a centralized error handling system with the following error types:
- `BadRequest` (400) - Invalid input
- `Unauthorized` (401) - Authentication required
- `Forbidden` (403) - Insufficient privileges
- `NotFound` (404) - Resource not found
- `Conflict` (409) - Resource conflict
- `InternalServerError` (500) - Server error

## Pagination

All list endpoints support pagination with the following query parameters:
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `sortBy` (default: 'createdAt')
- `sortOrder` (default: 'desc')

## Response Format

Standard response format:
```json
{
    "status": "success",
    "data": {
        "resourceName": [...],
        "pagination": {
            "total": 100,
            "page": 1,
            "limit": 10,
            "totalPages": 10,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code

### Code Style
- ESLint for code linting
- Prettier for code formatting
- Follows Airbnb JavaScript Style Guide

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.