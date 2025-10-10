/**
 * Backend input sanitization utilities
 */

// List of inappropriate words that should be blocked
const BLOCKED_WORDS = [
    'nigger', 'nigga', 'n1gger', 'n1gga',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
    'retard', 'fag', 'faggot',
    'ass', 'asshole', 'bastard', 'damn', 'hell',
    'whore', 'slut', 'piss',
    // Add leetspeak/number variations
    'f4ck', 'fvck', 'sh1t', 'b1tch', 'a55', 'a55hole'
];

/**
 * Check if text contains inappropriate words
 * @param {string} text - The text to check
 * @returns {boolean} true if inappropriate content is found
 */
function containsInappropriateContent(text) {
    if (!text) return false;

    const normalized = text.toLowerCase()
        // Normalize leetspeak
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/7/g, 't')
        .replace(/\$/g, 's')
        .replace(/@/g, 'a')
        // Remove special characters and spaces to catch obfuscation
        .replace(/[\s\-_.@#$%^&*()+=]/g, '');

    // Check for blocked words
    return BLOCKED_WORDS.some(word => {
        const normalizedWord = word.toLowerCase().replace(/[\s\-_.]/g, '');
        return normalized.includes(normalizedWord);
    });
}

/**
 * Sanitize a string by removing HTML tags and dangerous characters
 * @param {string} input - The string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, maxLength = 100) {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers (onclick, onerror, etc.)
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol (can be used for XSS)
        .replace(/data:text\/html/gi, '')
        // Trim whitespace
        .trim();

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitize player name specifically
 * - Allows letters, numbers, spaces, hyphens, apostrophes, and periods
 * - Maximum 50 characters
 * @param {string} name - The player name to sanitize
 * @param {boolean} trimSpaces - Whether to trim leading/trailing spaces (default: true for backend)
 * @returns {string} Sanitized player name
 */
function sanitizePlayerName(name, trimSpaces = true) {
    if (!name || typeof name !== 'string') return '';

    // Don't use sanitizeInput's trim - we'll handle trimming separately
    let sanitized = name
        .replace(/<[^>]*>/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '');

    // Only allow: letters, numbers, spaces, hyphens, apostrophes, periods
    sanitized = sanitized.replace(/[^\p{L}\p{N}\s\-'.]/gu, '');

    // Remove multiple consecutive spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Trim if requested (backend should always trim for storage)
    if (trimSpaces) {
        sanitized = sanitized.trim();
    }

    // Limit length
    if (sanitized.length > 50) {
        sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
}

/**
 * Validate player name
 * @param {string} name - The player name to validate
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
function validatePlayerName(name) {
    const sanitized = sanitizePlayerName(name);

    if (!sanitized) {
        return { isValid: false, error: 'Name is required' };
    }

    if (sanitized.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    if (sanitized.length > 50) {
        return { isValid: false, error: 'Name must be less than 50 characters' };
    }

    // Check for at least one letter
    if (!/\p{L}/u.test(sanitized)) {
        return { isValid: false, error: 'Name must contain at least one letter' };
    }

    // Check for inappropriate content
    if (containsInappropriateContent(sanitized)) {
        return { isValid: false, error: 'Please choose an appropriate name' };
    }

    return { isValid: true };
}

/**
 * Sanitize join code
 * - Only allows alphanumeric characters
 * - Maximum 6 characters
 * - Converts to uppercase
 * @param {string} code - The join code to sanitize
 * @returns {string} Sanitized join code
 */
function sanitizeJoinCode(code) {
    if (!code || typeof code !== 'string') return '';

    let sanitized = code
        .trim()
        .toUpperCase()
        // Only allow alphanumeric
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);

    return sanitized;
}

module.exports = {
    sanitizeInput,
    sanitizePlayerName,
    validatePlayerName,
    sanitizeJoinCode
};

