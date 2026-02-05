const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers middleware - RELAXED for beginner-friendly setup
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers like onclick
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    // Disable some strict policies for easier development
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        error: 'Too many login attempts from this IP, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Input validation middleware
function validateInput(rules) {
    return (req, res, next) => {
        const errors = [];
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = req.body[field];
            
            if (rule.required && (!value || value.toString().trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            if (value && rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} must be at most ${rule.maxLength} characters`);
            }
            
            if (value && rule.pattern && !rule.pattern.test(value)) {
                errors.push(`${field} format is invalid`);
            }
            
            if (value && rule.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    errors.push(`${field} must be a valid email address`);
                }
            }
            
            if (value && rule.type === 'number') {
                if (isNaN(parseFloat(value))) {
                    errors.push(`${field} must be a number`);
                }
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors
            });
        }
        
        next();
    };
}

// Sanitize input middleware
function sanitizeInput(req, res, next) {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                // Remove potential XSS content
                req.body[key] = req.body[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+=/gi, '');
            }
        }
    }
    next();
}

// Request logging middleware
function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('user-agent') || 'unknown';
    
    console.log(`[${timestamp}] ${ip} - ${method} ${url} - ${userAgent}`);
    
    next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
    
    if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Invalid JSON in request body',
            code: 'INVALID_JSON'
        });
    }
    
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: err.stack })
    });
}

// 404 handler
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        method: req.method
    });
}

module.exports = {
    securityHeaders,
    apiLimiter,
    authLimiter,
    validateInput,
    sanitizeInput,
    requestLogger,
    errorHandler,
    notFoundHandler
};