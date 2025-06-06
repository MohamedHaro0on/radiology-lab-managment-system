import * as yup from 'yup';
import * as Yup from 'yup';
import { t } from 'i18next';

// Common validation patterns
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
const passwordRegex = /^.{8,}$/; // Only requires minimum 8 characters

// Auth schemas
export const loginSchema = yup.object({
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
    username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
});

export const twoFactorSchema = yup.object({
    code: yup
        .string()
        .matches(/^[0-9]{6}$/, 'Code must be exactly 6 digits')
        .required('Verification code is required'),
});

// Patient schemas
export const patientSchema = yup.object().shape({
    firstName: yup.string().required(t('validation.required')),
    lastName: yup.string().required(t('validation.required')),
    dateOfBirth: yup.date().required(t('validation.required')),
    gender: yup.string().required(t('validation.required')),
    phoneNumber: yup.string().required(t('validation.required')),
    email: yup.string().email(t('validation.email')).nullable(),
    address: yup.object().shape({
        street: yup.string(),
        city: yup.string(),
        state: yup.string(),
        postalCode: yup.string(),
        country: yup.string(),
    }),
    medicalHistory: yup.array().of(yup.string()),
    doctor: yup.object().shape({
        _id: yup.string().required(t('validation.required')),
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        specialization: yup.string().required(),
    }).required(t('validation.doctorRequired')),
});

// Doctor schemas
export const doctorSchema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    specialization: yup.string().required('Specialization is required'),
    licenseNumber: yup.string().required('License number is required'),
    phoneNumber: yup
        .string()
        .matches(phoneRegex, 'Invalid phone number format')
        .required('Phone number is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    address: yup.object({
        street: yup.string(),
        city: yup.string(),
        state: yup.string(),
        postalCode: yup.string(),
        country: yup.string().default('India'),
    }),
    qualifications: yup.array().of(
        yup.object({
            degree: yup.string().required('Degree is required'),
            institution: yup.string().required('Institution is required'),
            year: yup
                .number()
                .min(1900, 'Year must be after 1900')
                .max(new Date().getFullYear(), 'Year cannot be in the future')
                .required('Year is required'),
        })
    ),
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
    itemName: yup.string().required('Item name is required'),
    category: yup
        .string()
        .oneOf(['xray-film', 'contrast-media', 'medical-supplies', 'equipment', 'other'], 'Invalid category')
        .required('Category is required'),
    quantity: yup.number().min(0, 'Quantity cannot be negative').required('Quantity is required'),
    unit: yup
        .string()
        .oneOf(['box', 'piece', 'pack', 'bottle', 'kit'], 'Invalid unit')
        .required('Unit is required'),
    minimumQuantity: yup
        .number()
        .min(0, 'Minimum quantity cannot be negative')
        .required('Minimum quantity is required'),
    supplier: yup.object({
        name: yup.string(),
        contactPerson: yup.string(),
        phoneNumber: yup.string().matches(phoneRegex, 'Invalid phone number format'),
        email: yup.string().email('Invalid email format'),
    }),
    expiryDate: yup.date().min(new Date(), 'Expiry date cannot be in the past'),
    batchNumber: yup.string(),
    location: yup.string().required('Location is required'),
    notes: yup.string(),
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
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    phoneNumber: yup
        .string()
        .matches(phoneRegex, 'Invalid phone number format')
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