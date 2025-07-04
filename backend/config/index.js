import dotenv from 'dotenv';
import Joi from 'joi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { errors } from '../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = join(process.cwd(), envFile);
dotenv.config({ path: envPath });

// Define validation schema for environment variables
const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    MONGODB_URI: Joi.string().default('mongodb://localhost:27017/radiology_lab'),
    JWT_SECRET: Joi.string().default('your-super-secret-jwt-key-change-this-in-production'),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    JWT_REFRESH_SECRET: Joi.string().default('your-super-secret-refresh-jwt-key-change-this-in-production'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX: Joi.number().default(100),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // SMTP Configuration (optional for development)
    SMTP_HOST: Joi.string().default('smtp.gmail.com'),
    SMTP_PORT: Joi.number().default(587),
    SMTP_SECURE: Joi.string().valid('true', 'false').default('false'),
    SMTP_USER: Joi.string().default('your-email@gmail.com'),
    SMTP_PASS: Joi.string().default('your-app-password'),
    FRONTEND_URL: Joi.string().default('http://localhost:3000')
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    console.warn(`Config validation warning: ${error.message}`);
    // For development, we'll use defaults instead of throwing an error
}

// Export validated config
const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongodb: {
        uri: envVars.MONGODB_URI
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: envVars.JWT_EXPIRES_IN,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN
    },
    cors: {
        allowedOrigins: envVars.ALLOWED_ORIGINS.split(',')
    },
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX
    },
    logLevel: envVars.LOG_LEVEL,
    smtp: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        secure: envVars.SMTP_SECURE === 'true',
        auth: {
            user: envVars.SMTP_USER,
            pass: envVars.SMTP_PASS
        }
    },
    frontendUrl: envVars.FRONTEND_URL
};

export default config; 