# Laboratory Management System

A comprehensive laboratory management system built with Node.js, Express, MongoDB, and React.

## Features

### Core Entities

1. **Doctors**
   - Name, specialization, phone number
   - Total patients referred (auto-incremented)
   - Total scans referred (auto-incremented)
   - Address information

2. **Patients**
   - Name, gender, age, phone number
   - Social number (unique identifier)
   - Doctor referral
   - Scans history
   - Address information

3. **Radiologists**
   - Name, gender, age, phone number
   - License ID (unique)
   - Total scans performed (auto-incremented)

4. **Scans**
   - Actual cost, minimum price, paid price
   - List of items with quantities
   - Description

5. **Stock**
   - Name, quantity, minimum threshold
   - Price, valid until date
   - Low stock and expiry tracking

6. **Expenses**
   - Date, reason, total cost, requester
   - Category, payment method, status
   - Approval workflow

7. **Appointments**
   - Radiologist, patient, scans list
   - Cost, price, profit calculation
   - Referring doctor
   - Scheduled time and status

8. **Users**
   - Role-based access control
   - Privilege management
   - Super admin functionality

### Business Logic

1. **Doctor Statistics**
   - `totalPatientsReferred` increments when a new patient is registered
   - `totalScansReferred` increments when a new appointment is scheduled

2. **Appointment Financials**
   - Automatic calculation of cost, price, and profit
   - Based on scan items and quantities

3. **Stock Management**
   - Low stock alerts
   - Expiry date tracking
   - Quantity management

4. **User Privileges**
   - Super admin can assign privileges to users
   - Minimum privilege is read access
   - Granular permissions per module

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/2fa/enable` - Enable 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Radiologists
- `GET /api/radiologists` - Get all radiologists
- `POST /api/radiologists` - Create radiologist
- `GET /api/radiologists/:id` - Get radiologist by ID
- `PUT /api/radiologists/:id` - Update radiologist
- `DELETE /api/radiologists/:id` - Delete radiologist

### Scans
- `GET /api/scans` - Get all scans
- `POST /api/scans` - Create scan
- `GET /api/scans/:id` - Get scan by ID
- `PUT /api/scans/:id` - Update scan
- `DELETE /api/scans/:id` - Delete scan

### Stock
- `GET /api/stock` - Get all stock items
- `POST /api/stock` - Create stock item
- `GET /api/stock/:id` - Get stock item by ID
- `PUT /api/stock/:id` - Update stock item
- `DELETE /api/stock/:id` - Delete stock item

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `PATCH /api/expenses/:id/approve` - Approve expense
- `PATCH /api/expenses/:id/reject` - Reject expense
- `PATCH /api/expenses/:id/mark-paid` - Mark expense as paid

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/laboratory-management
JWT_SECRET=your-jwt-secret-here
BCRYPT_SALT_ROUNDS=10
```

4. Create the admin user:
```bash
npm run create-admin
```

5. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm start
```

## Default Admin User

After running the admin creation script, you can login with:
- **Username:** admin
- **Password:** admin
- **Type:** Super Admin

## Database Schema

### Doctor Schema
```javascript
{
  name: String (required),
  specialization: String (required),
  phoneNumber: String (required),
  totalPatientsReferred: Number (default: 0),
  totalScansReferred: Number (default: 0),
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Patient Schema
```javascript
{
  name: String (required),
  gender: String (enum: ['male', 'female', 'other']),
  age: Number (required),
  phoneNumber: String (required),
  socialNumber: String (required, unique),
  doctorReferred: ObjectId (ref: Doctor, required),
  scansHistory: [{
    scan: ObjectId (ref: Scan),
    date: Date,
    status: String,
    notes: String
  }],
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Radiologist Schema
```javascript
{
  name: String (required),
  gender: String (enum: ['male', 'female', 'other']),
  age: Number (required),
  phoneNumber: String (required),
  licenseId: String (required, unique),
  totalScansPerformed: Number (default: 0),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Scan Schema
```javascript
{
  name: String (required),
  actualCost: Number (required),
  minPrice: Number (required),
  items: [{
    item: String (required),
    quantity: Number (required)
  }],
  description: String,
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Stock Schema
```javascript
{
  name: String (required),
  quantity: Number (required),
  minimumThreshold: Number (required),
  price: Number (required),
  validUntil: Date (required),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Expense Schema
```javascript
{
  date: Date (required),
  reason: String (required),
  totalCost: Number (required),
  requester: String (required),
  category: String (enum: ['operational', 'maintenance', 'supplies', 'utilities', 'salary', 'other']),
  description: String,
  paymentMethod: String (enum: ['cash', 'bank_transfer', 'check', 'credit_card', 'other']),
  status: String (enum: ['pending', 'approved', 'rejected', 'paid']),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

### Appointment Schema
```javascript
{
  radiologistId: ObjectId (ref: Radiologist, required),
  patientId: ObjectId (ref: Patient, required),
  scans: [{
    scan: ObjectId (ref: Scan, required),
    quantity: Number (default: 1)
  }],
  cost: Number (required),
  price: Number (required),
  profit: Number (required),
  referredBy: ObjectId (ref: Doctor, required),
  scheduledAt: Date (required),
  status: String (enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']),
  notes: String,
  cancelledAt: Date,
  cancelledBy: ObjectId (ref: User),
  cancellationReason: String,
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User)
}
```

## Business Logic Implementation

### Doctor Statistics Updates

1. **Patient Registration**: When a new patient is created, the `totalPatientsReferred` field of the referring doctor is automatically incremented.

2. **Appointment Scheduling**: When a new appointment is scheduled, the `totalScansReferred` field of the referring doctor is automatically incremented.

### Financial Calculations

1. **Appointment Financials**: The system automatically calculates cost, price, and profit for appointments based on the scans included and their respective costs and prices.

2. **Stock Management**: The system tracks low stock items and expired items, providing alerts and management capabilities.

### User Privileges

1. **Super Admin**: Has access to all modules and can assign privileges to other users.

2. **Module-based Access**: Users can have different levels of access (view, create, update, delete) for each module.

3. **Minimum Access**: All users have at least read access to all modules.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 