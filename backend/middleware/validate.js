import { errors } from '../utils/errorHandler.js';
import Joi from 'joi';

export const validate = (schema) => {
    return (req, res, next) => {
        try {
            console.log('=== VALIDATION DEBUG ===');
            console.log('Schema:', schema);
            console.log('Request body:', req.body);
            console.log('Request headers:', req.headers);

            // Handle both schema formats: direct schema or object with body/params/query
            let bodySchema = schema;
            let paramsSchema = null;
            let querySchema = null;

            if (schema && typeof schema === 'object' && (schema.body || schema.params || schema.query)) {
                bodySchema = schema.body;
                paramsSchema = schema.params;
                querySchema = schema.query;
            }

            // Validate request body
            if (bodySchema) {
                console.log('Validating body with schema:', bodySchema.describe());
                const { error, value } = bodySchema.validate(req.body, {
                    abortEarly: false,
                    stripUnknown: true
                });
                console.log('Validation result - error:', error);
                console.log('Validation result - value:', value);

                if (error) {
                    console.log('Validation failed:', error.details);
                    throw errors.ValidationError(error.details.map(detail => detail.message).join('. '));
                }
            }

            // Validate request params
            if (paramsSchema) {
                console.log('Validating params with schema:', paramsSchema.describe());
                console.log('Request params:', req.params);
                const { error } = paramsSchema.validate(req.params, {
                    abortEarly: false,
                    stripUnknown: true
                });
                console.log('Params validation result - error:', error);
                if (error) {
                    console.log('Params validation failed:', error.details);
                    throw errors.ValidationError(error.details.map(detail => detail.message).join('. '));
                }
            }

            // Validate request query
            if (querySchema) {
                const { error } = querySchema.validate(req.query, {
                    abortEarly: false,
                    stripUnknown: true
                });
                if (error) {
                    throw errors.ValidationError(error.details.map(detail => detail.message).join('. '));
                }
            }

            console.log('Validation passed');
            console.log('==================');
            next();
        } catch (error) {
            console.log('Validation error caught:', error);
            next(error);
        }
    };
};

// Validation schemas
const schemas = {
    // User schemas
    userCreate: Joi.object({
        username: Joi.string().required().min(3).max(30),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(6),
        role: Joi.string().valid('admin', 'doctor', 'receptionist', 'technician').required()
    }),

    userLogin: Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required()
    }),

    // Patient schemas
    patientCreate: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        dateOfBirth: Joi.date().required(),
        gender: Joi.string().valid('Male', 'Female', 'Other').required(),
        phoneNumber: Joi.string().required(),
        email: Joi.string().email(),
        address: Joi.object({
            street: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            zipCode: Joi.string()
        })
    }),

    // Doctor schemas
    doctorCreate: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        specialization: Joi.string().required(),
        licenseNumber: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        email: Joi.string().required().email(),
        address: Joi.object({
            street: Joi.string(),
            city: Joi.string(),
            state: Joi.string(),
            zipCode: Joi.string()
        }),
        workingHours: Joi.array().items(
            Joi.object({
                day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                startTime: Joi.string(),
                endTime: Joi.string()
            })
        )
    }),

    // Appointment schemas
    appointmentCreate: Joi.object({
        patient: Joi.string().required(),
        doctor: Joi.string().required(),
        appointmentDate: Joi.date().required(),
        appointmentTime: Joi.string().required(),
        type: Joi.string().valid('X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Other').required(),
        priority: Joi.string().valid('Routine', 'Urgent', 'Emergency').default('Routine'),
        notes: Joi.string()
    }),

    // Stock schemas
    stockCreate: Joi.object({
        itemName: Joi.string().required(),
        category: Joi.string().valid('X-Ray Film', 'Contrast Media', 'Medical Supplies', 'Equipment', 'Other').required(),
        quantity: Joi.number().required().min(0),
        unit: Joi.string().valid('Box', 'Piece', 'Pack', 'Bottle', 'Kit').required(),
        minimumQuantity: Joi.number().required().min(0),
        supplier: Joi.object({
            name: Joi.string(),
            contactPerson: Joi.string(),
            phoneNumber: Joi.string(),
            email: Joi.string().email()
        }),
        expiryDate: Joi.date(),
        batchNumber: Joi.string(),
        location: Joi.string().required(),
        notes: Joi.string()
    }),

    // Medical History schemas
    medicalHistoryCreate: Joi.object({
        condition: Joi.string().required(),
        diagnosis: Joi.string().required(),
        date: Joi.date(),
        notes: Joi.string()
    }),

    // Referral schemas
    referralCreate: Joi.object({
        doctorId: Joi.string().required(),
        reason: Joi.string().required()
    }),

    referralUpdate: Joi.object({
        status: Joi.string().valid('Pending', 'Completed', 'Cancelled').required()
    })
};

export { schemas }; 