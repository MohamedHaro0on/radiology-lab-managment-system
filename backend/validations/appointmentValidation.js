import Joi from 'joi';

export const appointmentValidation = {
    createAppointment: {
        body: Joi.object({
            patientId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid patient ID format',
                'any.required': 'Patient ID is required'
            }),
            doctorId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid doctor ID format',
                'any.required': 'Doctor ID is required'
            }),
            appointmentDate: Joi.date().required().min('now').messages({
                'date.base': 'Please provide a valid appointment date',
                'date.min': 'Appointment date must be in the future',
                'any.required': 'Appointment date is required'
            }),
            timeSlot: Joi.object({
                start: Joi.string().required().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
                    'string.pattern.base': 'Time must be in HH:MM format',
                    'any.required': 'Start time is required'
                }),
                end: Joi.string().required().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
                    'string.pattern.base': 'Time must be in HH:MM format',
                    'any.required': 'End time is required'
                })
            }).required().custom((obj, helpers) => {
                const start = new Date(`2000-01-01T${obj.start}`);
                const end = new Date(`2000-01-01T${obj.end}`);
                if (start >= end) {
                    return helpers.error('any.invalid', { message: 'End time must be after start time' });
                }
                return obj;
            }),
            type: Joi.string().required().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other').messages({
                'any.only': 'Invalid appointment type',
                'any.required': 'Appointment type is required'
            }),
            priority: Joi.string().valid('routine', 'urgent', 'emergency').default('routine'),
            notes: Joi.string().trim(),
            referralSource: Joi.string().trim()
        })
    },

    getAllAppointments: {
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            patient: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
            type: Joi.string().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'),
            priority: Joi.string().valid('routine', 'urgent', 'emergency'),
            startDate: Joi.date(),
            endDate: Joi.date().min(Joi.ref('startDate')),
            sortBy: Joi.string().valid('appointmentDate', 'createdAt', 'status').default('appointmentDate'),
            sortOrder: Joi.string().valid('asc', 'desc').default('asc')
        })
    },

    getAppointment: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid appointment ID format',
                'any.required': 'Appointment ID is required'
            })
        })
    },

    updateAppointment: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid appointment ID format',
                'any.required': 'Appointment ID is required'
            })
        }),
        body: Joi.object({
            appointmentDate: Joi.date().min('now'),
            timeSlot: Joi.object({
                start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
                end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
            }).custom((obj, helpers) => {
                if (obj.start && obj.end) {
                    const start = new Date(`2000-01-01T${obj.start}`);
                    const end = new Date(`2000-01-01T${obj.end}`);
                    if (start >= end) {
                        return helpers.error('any.invalid', { message: 'End time must be after start time' });
                    }
                }
                return obj;
            }),
            type: Joi.string().valid('X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography', 'Other'),
            priority: Joi.string().valid('routine', 'urgent', 'emergency'),
            notes: Joi.string().trim(),
            referralSource: Joi.string().trim()
        }).min(1).messages({
            'object.min': 'At least one field must be provided for update'
        })
    },

    updateAppointmentStatus: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid appointment ID format',
                'any.required': 'Appointment ID is required'
            })
        }),
        body: Joi.object({
            status: Joi.string().required().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show').messages({
                'any.only': 'Invalid status',
                'any.required': 'Status is required'
            }),
            diagnosis: Joi.string().when('status', {
                is: 'completed',
                then: Joi.string().required().messages({
                    'string.empty': 'Diagnosis is required when completing an appointment',
                    'any.required': 'Diagnosis is required when completing an appointment'
                }),
                otherwise: Joi.string().optional()
            }),
            treatment: Joi.string().when('status', {
                is: 'completed',
                then: Joi.string().required().messages({
                    'string.empty': 'Treatment is required when completing an appointment',
                    'any.required': 'Treatment is required when completing an appointment'
                }),
                otherwise: Joi.string().optional()
            }),
            notes: Joi.string().optional()
        })
    },

    deleteAppointment: {
        params: Joi.object({
            id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Invalid appointment ID format',
                'any.required': 'Appointment ID is required'
            })
        })
    },

    getAppointmentsByDateRange: {
        query: Joi.object({
            startDate: Joi.date().required().messages({
                'date.base': 'Please provide a valid start date',
                'any.required': 'Start date is required'
            }),
            endDate: Joi.date().required().min(Joi.ref('startDate')).messages({
                'date.base': 'Please provide a valid end date',
                'date.min': 'End date must be after start date',
                'any.required': 'End date is required'
            }),
            doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')
        })
    }
};

export default appointmentValidation; 