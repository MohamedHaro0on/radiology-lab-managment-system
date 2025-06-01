import cors from 'cors';
import helmet from 'helmet';
import { errors } from '../utils/errorHandler.js';

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3001', 'http://localhost:3000']; // Allow both frontend and backend origins

        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(
                errors.Forbidden('Not allowed by CORS'),
                false
            );
        }

        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Helmet configuration
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3000"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
};

// Security middleware setup
export const setupSecurityMiddleware = (app) => {
    // Apply Helmet
    app.use(helmet(helmetOptions));

    // Apply CORS
    app.use(cors(corsOptions));

    // Additional security headers
    app.use((req, res, next) => {
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');

        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Enable XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Disable caching for sensitive routes
        if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/users')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }

        next();
    });

    // Rate limiting headers
    app.use((req, res, next) => {
        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', res.getHeader('X-RateLimit-Remaining') || '100');
        res.setHeader('X-RateLimit-Reset', res.getHeader('X-RateLimit-Reset') || Math.floor(Date.now() / 1000) + 900);
        next();
    });
};

// Export security configurations
export const securityConfig = {
    cors: corsOptions,
    helmet: helmetOptions
}; 