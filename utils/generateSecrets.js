import crypto from 'crypto';

/**
 * Generate a secure random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export const generateRandomNumber = (min, max) => {
    const range = max - min;
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32BE(0);
    return min + (randomNumber % range);
};

/**
 * Generate all required secrets for the application
 * @returns {Object} Object containing all generated secrets
 */
export const generateAllSecrets = () => {
    return {
        JWT_SECRET: generateRandomString(64),
        JWT_REFRESH_SECRET: generateRandomString(64),
        SESSION_SECRET: generateRandomString(64),
        BCRYPT_SALT_ROUNDS: generateRandomNumber(10, 14),
        RATE_LIMIT_MAX_REQUESTS: generateRandomNumber(50, 200),
        SMTP_PASS: generateRandomString(32),
        // Add more secrets as needed
    };
};

/**
 * Generate a new .env file with secure values
 * @param {string} env - Environment (development/production)
 */
export const generateEnvFile = (env = 'development') => {
    const secrets = generateAllSecrets();
    const timestamp = new Date().toISOString();

    const envContent = `# Generated on ${timestamp}
# Environment: ${env}

# Server Configuration
PORT=5000
NODE_ENV=${env}

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/radiology-lab

# JWT Configuration
JWT_SECRET=${secrets.JWT_SECRET}
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=${secrets.BCRYPT_SALT_ROUNDS}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=${secrets.RATE_LIMIT_MAX_REQUESTS}
SESSION_SECRET=${secrets.SESSION_SECRET}
SESSION_EXPIRES_IN=24h

# ... (rest of the environment variables)
`;

    return envContent;
};

// If this file is run directly, generate secrets and print them
if (process.argv[1] === import.meta.url) {
    const env = process.argv[2] || 'development';
    console.log(generateEnvFile(env));
} 