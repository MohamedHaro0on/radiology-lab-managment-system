import Joi from 'joi';

// Helper function to get localized validation messages
const getLocalizedMessage = (req, key, params = {}) => {
    const acceptLanguage = req.headers['accept-language'] || 'en';
    const isArabic = acceptLanguage.includes('ar');

    const messages = {
        en: {
            'branch.name.required': 'Branch name is required',
            'branch.name.min': 'Branch name must be at least {{min}} characters',
            'branch.name.max': 'Branch name cannot exceed {{max}} characters',
            'branch.location.required': 'Location is required',
            'branch.location.min': 'Location must be at least {{min}} characters',
            'branch.location.max': 'Location cannot exceed {{max}} characters',
            'branch.address.required': 'Address is required',
            'branch.address.min': 'Address must be at least {{min}} characters',
            'branch.address.max': 'Address cannot exceed {{max}} characters',
            'branch.phone.required': 'Phone number is required',
            'branch.phone.pattern': 'Phone number must be in the format +20 followed by 10 digits',
            'branch.manager.required': 'Manager name is required',
            'branch.manager.min': 'Manager name must be at least {{min}} characters',
            'branch.manager.max': 'Manager name cannot exceed {{max}} characters',
            'branch.name.empty': 'Branch name cannot be empty',
            'branch.location.empty': 'Location cannot be empty',
            'branch.address.empty': 'Address cannot be empty',
            'branch.phone.empty': 'Phone number cannot be empty',
            'branch.manager.empty': 'Manager name cannot be empty',
            'branch.isActive.boolean': 'isActive must be a boolean value',
            'branch.id.pattern': 'Invalid branch ID format',
            'branch.id.required': 'Branch ID is required',
            'query.page.number': 'Page must be a number',
            'query.page.integer': 'Page must be an integer',
            'query.page.min': 'Page must be at least 1',
            'query.limit.number': 'Limit must be a number',
            'query.limit.integer': 'Limit must be an integer',
            'query.limit.min': 'Limit must be at least 1',
            'query.limit.max': 'Limit cannot exceed 100',
            'query.search.max': 'Search term cannot exceed 100 characters',
            'query.status.only': 'Status must be one of: active, inactive, all',
            'query.sortBy.only': 'Sort by must be one of: name, location, manager, createdAt, updatedAt',
            'query.sortOrder.only': 'Sort order must be one of: asc, desc'
        },
        ar: {
            'branch.name.required': 'اسم الفرع مطلوب',
            'branch.name.min': 'يجب أن يكون اسم الفرع على الأقل {{min}} أحرف',
            'branch.name.max': 'لا يمكن أن يتجاوز اسم الفرع {{max}} حرف',
            'branch.location.required': 'الموقع مطلوب',
            'branch.location.min': 'يجب أن يكون الموقع على الأقل {{min}} أحرف',
            'branch.location.max': 'لا يمكن أن يتجاوز الموقع {{max}} حرف',
            'branch.address.required': 'العنوان مطلوب',
            'branch.address.min': 'يجب أن يكون العنوان على الأقل {{min}} أحرف',
            'branch.address.max': 'لا يمكن أن يتجاوز العنوان {{max}} حرف',
            'branch.phone.required': 'رقم الهاتف مطلوب',
            'branch.phone.pattern': 'يجب أن يكون رقم الهاتف بالتنسيق +20 متبوعاً بـ 10 أرقام',
            'branch.manager.required': 'اسم المدير مطلوب',
            'branch.manager.min': 'يجب أن يكون اسم المدير على الأقل {{min}} أحرف',
            'branch.manager.max': 'لا يمكن أن يتجاوز اسم المدير {{max}} حرف',
            'branch.name.empty': 'اسم الفرع لا يمكن أن يكون فارغاً',
            'branch.location.empty': 'الموقع لا يمكن أن يكون فارغاً',
            'branch.address.empty': 'العنوان لا يمكن أن يكون فارغاً',
            'branch.phone.empty': 'رقم الهاتف لا يمكن أن يكون فارغاً',
            'branch.manager.empty': 'اسم المدير لا يمكن أن يكون فارغاً',
            'branch.isActive.boolean': 'يجب أن تكون الحالة قيمة منطقية',
            'branch.id.pattern': 'تنسيق معرف الفرع غير صحيح',
            'branch.id.required': 'معرف الفرع مطلوب',
            'query.page.number': 'يجب أن تكون الصفحة رقماً',
            'query.page.integer': 'يجب أن تكون الصفحة رقماً صحيحاً',
            'query.page.min': 'يجب أن تكون الصفحة 1 على الأقل',
            'query.limit.number': 'يجب أن يكون الحد رقماً',
            'query.limit.integer': 'يجب أن يكون الحد رقماً صحيحاً',
            'query.limit.min': 'يجب أن يكون الحد 1 على الأقل',
            'query.limit.max': 'لا يمكن أن يتجاوز الحد 100',
            'query.search.max': 'لا يمكن أن يتجاوز مصطلح البحث 100 حرف',
            'query.status.only': 'يجب أن تكون الحالة واحدة من: نشط، غير نشط، الكل',
            'query.sortBy.only': 'يجب أن يكون الترتيب حسب واحد من: الاسم، الموقع، المدير، تاريخ الإنشاء، تاريخ التحديث',
            'query.sortOrder.only': 'يجب أن يكون ترتيب الفرز واحد من: تصاعدي، تنازلي'
        }
    };

    const lang = isArabic ? 'ar' : 'en';
    let message = messages[lang][key] || messages.en[key] || key;

    // Replace placeholders
    Object.keys(params).forEach(param => {
        message = message.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });

    return message;
};

// Validation schema for creating a branch
export const createBranchSchema = (req) => Joi.object({
    name: Joi.string()
        .required()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.name.required'),
            'string.min': getLocalizedMessage(req, 'branch.name.min', { min: 3 }),
            'string.max': getLocalizedMessage(req, 'branch.name.max', { max: 100 }),
            'any.required': getLocalizedMessage(req, 'branch.name.required')
        }),
    location: Joi.string()
        .required()
        .min(5)
        .max(200)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.location.required'),
            'string.min': getLocalizedMessage(req, 'branch.location.min', { min: 5 }),
            'string.max': getLocalizedMessage(req, 'branch.location.max', { max: 200 }),
            'any.required': getLocalizedMessage(req, 'branch.location.required')
        }),
    address: Joi.string()
        .required()
        .min(10)
        .max(500)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.address.required'),
            'string.min': getLocalizedMessage(req, 'branch.address.min', { min: 10 }),
            'string.max': getLocalizedMessage(req, 'branch.address.max', { max: 500 }),
            'any.required': getLocalizedMessage(req, 'branch.address.required')
        }),
    phone: Joi.string()
        .required()
        .pattern(/^\+20\d{10}$/)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.phone.required'),
            'string.pattern.base': getLocalizedMessage(req, 'branch.phone.pattern'),
            'any.required': getLocalizedMessage(req, 'branch.phone.required')
        }),
    manager: Joi.string()
        .required()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.manager.required'),
            'string.min': getLocalizedMessage(req, 'branch.manager.min', { min: 2 }),
            'string.max': getLocalizedMessage(req, 'branch.manager.max', { max: 100 }),
            'any.required': getLocalizedMessage(req, 'branch.manager.required')
        }),
    isActive: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': getLocalizedMessage(req, 'branch.isActive.boolean')
        })
});

// Validation schema for updating a branch
export const updateBranchSchema = (req) => Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.name.empty'),
            'string.min': getLocalizedMessage(req, 'branch.name.min', { min: 3 }),
            'string.max': getLocalizedMessage(req, 'branch.name.max', { max: 100 })
        }),
    location: Joi.string()
        .min(5)
        .max(200)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.location.empty'),
            'string.min': getLocalizedMessage(req, 'branch.location.min', { min: 5 }),
            'string.max': getLocalizedMessage(req, 'branch.location.max', { max: 200 })
        }),
    address: Joi.string()
        .min(10)
        .max(500)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.address.empty'),
            'string.min': getLocalizedMessage(req, 'branch.address.min', { min: 10 }),
            'string.max': getLocalizedMessage(req, 'branch.address.max', { max: 500 })
        }),
    phone: Joi.string()
        .pattern(/^\+20\d{10}$/)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.phone.empty'),
            'string.pattern.base': getLocalizedMessage(req, 'branch.phone.pattern')
        }),
    manager: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .messages({
            'string.empty': getLocalizedMessage(req, 'branch.manager.empty'),
            'string.min': getLocalizedMessage(req, 'branch.manager.min', { min: 2 }),
            'string.max': getLocalizedMessage(req, 'branch.manager.max', { max: 100 })
        }),
    isActive: Joi.boolean()
        .messages({
            'boolean.base': getLocalizedMessage(req, 'branch.isActive.boolean')
        })
});

// Validation schema for branch ID parameter
export const branchIdSchema = (req) => Joi.object({
    id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': getLocalizedMessage(req, 'branch.id.pattern'),
            'any.required': getLocalizedMessage(req, 'branch.id.required')
        })
});

// Validation schema for branch query parameters
export const branchQuerySchema = (req) => Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': getLocalizedMessage(req, 'query.page.number'),
            'number.integer': getLocalizedMessage(req, 'query.page.integer'),
            'number.min': getLocalizedMessage(req, 'query.page.min')
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': getLocalizedMessage(req, 'query.limit.number'),
            'number.integer': getLocalizedMessage(req, 'query.limit.integer'),
            'number.min': getLocalizedMessage(req, 'query.limit.min'),
            'number.max': getLocalizedMessage(req, 'query.limit.max')
        }),
    search: Joi.string()
        .trim()
        .max(100)
        .messages({
            'string.max': getLocalizedMessage(req, 'query.search.max')
        }),
    status: Joi.string()
        .valid('active', 'inactive', 'all')
        .default('all')
        .messages({
            'any.only': getLocalizedMessage(req, 'query.status.only')
        }),
    sortBy: Joi.string()
        .valid('name', 'location', 'manager', 'createdAt', 'updatedAt')
        .default('name')
        .messages({
            'any.only': getLocalizedMessage(req, 'query.sortBy.only')
        }),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('asc')
        .messages({
            'any.only': getLocalizedMessage(req, 'query.sortOrder.only')
        })
});

// Middleware to validate request body
export const validateBranchBody = (schemaType) => {
    return (req, res, next) => {
        const schema = schemaType === 'create' ? createBranchSchema(req) : updateBranchSchema(req);
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req.body = value;
        next();
    };
};

// Middleware to validate request parameters
export const validateBranchParams = (req, res, next) => {
    const { error, value } = branchIdSchema(req).validate(req.params, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    req.params = value;
    next();
};

// Middleware to validate query parameters
export const validateBranchQuery = (req, res, next) => {
    const { error, value } = branchQuerySchema(req).validate(req.query, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }))
        });
    }

    req.query = value;
    next();
};

// Export all validation schemas and middleware as an object
export const branchValidation = {
    createBranchSchema,
    updateBranchSchema,
    branchIdSchema,
    branchQuerySchema,
    validateBranchBody,
    validateBranchParams,
    validateBranchQuery
};

export default branchValidation; 