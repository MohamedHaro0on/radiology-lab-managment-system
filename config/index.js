import dotenv from 'dotenv';
import Joi from 'joi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errors } from '../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: join(__dirname, '..', envFile) });

// Define validation schema
const envSchema = Joi.object({
    // Server
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().port().required(),

    // MongoDB
    MONGODB_URI: Joi.string().uri().required(),

    // JWT
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

    // Email
    SMTP_HOST: Joi.string().hostname().required(),
    SMTP_PORT: Joi.number().port().required(),
    SMTP_USER: Joi.string().email().required(),
    SMTP_PASS: Joi.string().min(8).required(),
    EMAIL_FROM: Joi.string().email().required(),

    // Security
    BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(14).required(),
    RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(60000).required(),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).required(),
    SESSION_SECRET: Joi.string().min(32).required(),
    SESSION_EXPIRES_IN: Joi.string().required(),

    // File Upload
    UPLOAD_PATH: Joi.string().required(),
    MAX_FILE_SIZE: Joi.number().integer().min(1048576).required(), // Min 1MB

    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
    LOG_FILE_PATH: Joi.string().required(),

    // Pagination
    DEFAULT_PAGE_SIZE: Joi.number().integer().min(1).max(100).required(),
    MAX_PAGE_SIZE: Joi.number().integer().min(1).max(1000).required(),

    // Feature Flags
    ENABLE_TWO_FACTOR: Joi.boolean().required(),
    ENABLE_EMAIL_NOTIFICATIONS: Joi.boolean().required(),
    ENABLE_FILE_UPLOADS: Joi.boolean().required(),
    ENABLE_RATE_LIMITING: Joi.boolean().required(),

    // CORS
    CORS_ORIGIN: Joi.string().uri().required(),
    CORS_METHODS: Joi.string().required(),
    CORS_CREDENTIALS: Joi.boolean().required(),

    // Cache
    REDIS_URL: Joi.string().uri().when('ENABLE_CACHING', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    CACHE_TTL: Joi.number().integer().min(60).when('ENABLE_CACHING', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),

    // Monitoring
    ENABLE_MONITORING: Joi.boolean().required(),
    SENTRY_DSN: Joi.string().uri().when('ENABLE_MONITORING', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    NEW_RELIC_LICENSE_KEY: Joi.string().when('ENABLE_MONITORING', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
    })
}).unknown(); // Allow unknown keys

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw errors.InternalServer(`Config validation error: ${error.message}`);
}

// Export validated configuration
const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',

    mongodb: {
        uri: envVars.MONGODB_URI
    },

    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN
    },

    email: {
        smtp: {
            host: envVars.SMTP_HOST,
            port: envVars.SMTP_PORT,
            auth: {
                user: envVars.SMTP_USER,
                pass: envVars.SMTP_PASS
            }
        },
        from: envVars.EMAIL_FROM
    },

    security: {
        bcryptSaltRounds: envVars.BCRYPT_SALT_ROUNDS,
        rateLimit: {
            windowMs: envVars.RATE_LIMIT_WINDOW_MS,
            max: envVars.RATE_LIMIT_MAX_REQUESTS
        },
        session: {
            secret: envVars.SESSION_SECRET,
            expiresIn: envVars.SESSION_EXPIRES_IN
        }
    },

    upload: {
        path: envVars.UPLOAD_PATH,
        maxFileSize: envVars.MAX_FILE_SIZE
    },

    logging: {
        level: envVars.LOG_LEVEL,
        filePath: envVars.LOG_FILE_PATH
    },

    pagination: {
        defaultPageSize: envVars.DEFAULT_PAGE_SIZE,
        maxPageSize: envVars.MAX_PAGE_SIZE
    },

    features: {
        twoFactor: envVars.ENABLE_TWO_FACTOR,
        emailNotifications: envVars.ENABLE_EMAIL_NOTIFICATIONS,
        fileUploads: envVars.ENABLE_FILE_UPLOADS,
        rateLimiting: envVars.ENABLE_RATE_LIMITING
    },

    cors: {
        origin: envVars.CORS_ORIGIN,
        methods: envVars.CORS_METHODS.split(','),
        credentials: envVars.CORS_CREDENTIALS
    },

    cache: envVars.ENABLE_CACHING ? {
        url: envVars.REDIS_URL,
        ttl: envVars.CACHE_TTL
    } : null,

    monitoring: envVars.ENABLE_MONITORING ? {
        sentry: {
            dsn: envVars.SENTRY_DSN
        },
        newRelic: {
            licenseKey: envVars.NEW_RELIC_LICENSE_KEY
        }
    } : null
};

export default config; 