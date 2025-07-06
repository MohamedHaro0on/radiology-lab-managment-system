import * as yup from 'yup';
import * as Yup from 'yup';
import { t } from 'i18next';

// Common validation patterns
const phoneRegex = /^\d{10}$/;
const passwordRegex = /^.{8,}$/; // Only requires minimum 8 characters

// Auth schemas
export const loginSchema = yup.object({
    username: yup.string().required('Username is required'),
    password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
    username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
    name: yup.string().min(3, 'Full name must be at least 3 characters').required('Full name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    role: yup.string().oneOf(['receptionist', 'doctor', 'radiologist', 'superAdmin'], 'Invalid role').required('Role is required'),
});

export const twoFactorSchema = yup.object({
    token: yup
        .string()
        .matches(/^[0-9]{6}$/, 'Code must be exactly 6 digits')
        .required('Verification code is required'),
});

// Patient schemas
export const patientSchema = yup.object().shape({
    name: yup.string()
        .min(2, 'Patient name must be at least 2 characters long')
        .max(100, 'Patient name cannot exceed 100 characters')
        .required('Patient name is required'),
    dateOfBirth: yup.date()
        .max(new Date(), 'Date of birth cannot be in the future')
        .required('Date of birth is required'),
    gender: yup.string()
        .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
        .required('Gender is required'),
    phoneNumber: yup.string()
        .matches(phoneRegex, 'Please enter a valid 10-digit phone number')
        .optional(),
    socialNumber: yup.string()
        .min(5, 'Social number must be at least 5 characters long')
        .max(20, 'Social number cannot exceed 20 characters')
        .optional(),
    address: yup.object().shape({
        street: yup.string(),
        city: yup.string(),
        state: yup.string(),
        postalCode: yup.string(),
        country: yup.string(),
    }),
    medicalHistory: yup.array().of(yup.string()).default([]),
    doctor: yup.object().shape({
        _id: yup.string().required('Please select a doctor'),
        name: yup.string().required('Doctor name is required'),
        specialization: yup.string().required('Doctor specialization is required'),
    }).required('Please select a referring doctor'),
});

// Doctor schemas
export const doctorSchema = yup.object({
    name: yup.string().required('Name is required'),
    specialization: yup.string().required('Specialization is required'),
    licenseNumber: yup.string().optional(),
    contactNumber: yup
        .string()
        .matches(phoneRegex, 'Please enter a valid 10-digit phone number')
        .optional(),
    address: yup.object({
        street: yup.string().optional(),
        city: yup.string().optional(),
        state: yup.string().optional(),
        country: yup.string().default('Egypt'),
    }).optional(),
    experience: yup.number().min(0, 'Experience cannot be negative'),
    isActive: yup.boolean().default(true),
    representative: yup.string().nullable().optional(),
});

// Radiologist schemas
export const radiologistSchema = yup.object({
    name: yup.string().required('Name is required'),
    gender: yup.string()
        .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
        .required('Gender is required'),
    age: yup.number()
        .integer('Age must be a whole number')
        .min(18, 'Age must be at least 18')
        .max(150, 'Age cannot exceed 150')
        .required('Age is required'),
    phoneNumber: yup
        .string()
        .matches(phoneRegex, 'Please enter a valid 10-digit phone number')
        .required('Phone number is required'),
    licenseId: yup.string()
        .min(5, 'License ID must be at least 5 characters long')
        .max(20, 'License ID cannot exceed 20 characters')
        .required('License ID is required'),
    isActive: yup.boolean().default(true),
});

// Appointment schemas
export const appointmentSchema = yup.object({
    patientId: yup.string().required('Patient is required'),
    doctorId: yup.string().required('Doctor is required'),
    date: yup.date().required('Date is required').min(new Date(), 'Date cannot be in the past'),
    time: yup.string().required('Time is required'),
    type: yup
        .string()
        .oneOf(['xray', 'ct', 'mri', 'ultrasound'], 'Invalid scan type')
        .required('Scan type is required'),
    priority: yup
        .string()
        .oneOf(['routine', 'urgent', 'emergency'], 'Invalid priority level')
        .default('routine'),
    notes: yup.string(),
});

// Stock schemas
export const stockSchema = yup.object({
    name: yup.string().required('Stock name is required'),
    branch: yup.string().required('Branch is required'),
    quantity: yup.number().min(0, 'Quantity cannot be negative').required('Quantity is required'),
    unit: yup.string().max(20, 'Unit cannot exceed 20 characters').required('Unit is required'),
    minimumThreshold: yup.number().min(0, 'Minimum threshold cannot be negative').required('Minimum threshold is required'),
    price: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
    validUntil: yup.date().min(new Date(), 'Valid until date must be in the future').required('Valid until date is required'),
});

// Scan schemas
export const scanSchema = yup.object({
    patientId: yup.string().required('Patient is required'),
    doctorId: yup.string().required('Doctor is required'),
    categoryId: yup.string().required('Scan category is required'),
    date: yup.date().required('Date is required'),
    status: yup
        .string()
        .oneOf(['scheduled', 'in-progress', 'completed', 'cancelled'], 'Invalid status')
        .default('scheduled'),
    notes: yup.string(),
    findings: yup.string(),
    attachments: yup.array().of(yup.string()),
});

// Scan Category schemas
export const scanCategorySchema = yup.object({
    name: yup.string().required('Category name is required'),
    description: yup.string(),
    price: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
    duration: yup.number().min(1, 'Duration must be at least 1 minute').required('Duration is required'),
    isActive: yup.boolean().default(true),
});

// Patient History schemas
export const patientHistorySchema = yup.object({
    patientId: yup.string().required('Patient is required'),
    doctorId: yup.string().required('Doctor is required'),
    date: yup.date().required('Date is required'),
    diagnosis: yup.string().required('Diagnosis is required'),
    treatment: yup.string().required('Treatment is required'),
    notes: yup.string(),
});

// Profile update schema
export const profileUpdateSchema = yup.object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    contactNumber: yup
        .string()
        .matches(phoneRegex, 'Please enter a valid 10-digit phone number')
        .required('Phone number is required'),
    currentPassword: yup.string().when('newPassword', {
        is: (val) => val?.length > 0,
        then: (schema) => schema.required('Current password is required to set a new password'),
    }),
    newPassword: yup.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: yup.string().when('newPassword', {
        is: (val) => val?.length > 0,
        then: (schema) =>
            schema
                .required('Please confirm your new password')
                .oneOf([yup.ref('newPassword'), null], 'Passwords must match'),
    }),
});

export const forgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
});

export const resetPasswordSchema = Yup.object().shape({
    password: Yup.string()
        .min(8, t('validation.minLength', { field: 'Password', length: 8 }))
        .required(t('validation.required')),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], t('validation.passwordsMustMatch'))
        .when('password', {
            is: (val) => val && val.length > 0,
            then: (schema) => schema.required(t('validation.required')),
        })
}); 