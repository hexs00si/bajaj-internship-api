// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const validateBfhl = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - helmet adds 11 security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API usage
    crossOriginEmbedderPolicy: false // Allow cross-origin requests
}));

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        is_success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
});

app.use(limiter);

// CORS configuration
app.use(cors());

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
    // Use combined format for production (Apache style)
    app.use(morgan('combined'));
} else {
    // Use dev format for development (colorized and concise)
    app.use(morgan('dev'));
}

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// POST endpoint for /bfhl with validation
app.post('/bfhl', validateBfhl, (req, res) => {
    try {
        const { data } = req.body;

        // Get user details from environment variables
        const response = {
            is_success: true,
            user_id: process.env.USER_ID || "default_user_ddmmyyyy",
            email: process.env.EMAIL || "default@example.com",
            roll_number: process.env.ROLL_NUMBER || "DEFAULT123",
            odd_numbers: [],
            even_numbers: [],
            alphabets: [],
            special_characters: [],
            sum: "0",
            concat_string: ""
        };

        let sum = 0;
        const allAlphabets = [];

        // Process each item in the data array
        for (let i = 0; i < data.length; i++) {
            const item = String(data[i]);
            
            // Check if it's a number
            if (/^\d+$/.test(item)) {
                const num = parseInt(item);
                sum += num;
                
                if (num % 2 === 0) {
                    response.even_numbers.push(item);
                } else {
                    response.odd_numbers.push(item);
                }
            }
            // Check if it's alphabetic
            else if (/^[a-zA-Z]+$/.test(item)) {
                response.alphabets.push(item.toUpperCase());
                allAlphabets.push(item);
            }
            // Everything else is special character
            else {
                response.special_characters.push(item);
            }
        }

        // Set sum as string
        response.sum = String(sum);

        // Generate concatenated string
        response.concat_string = generateConcatString(allAlphabets);

        res.status(200).json(response);

    } catch (error) {
        console.error('Error in /bfhl endpoint:', error);
        res.status(500).json({
            is_success: false,
            message: "Internal server error"
        });
    }
});

// Helper function to generate concatenated string
function generateConcatString(alphabets) {
    // Join all alphabets
    const allChars = alphabets.join('');
    
    // Reverse the string
    const reversed = allChars.split('').reverse().join('');
    
    // Apply alternating caps (even index = uppercase, odd index = lowercase)
    let result = '';
    for (let i = 0; i < reversed.length; i++) {
        if (i % 2 === 0) {
            result += reversed[i].toUpperCase();
        } else {
            result += reversed[i].toLowerCase();
        }
    }
    
    return result;
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: "Bajaj Finserv API is running!",
        version: process.env.API_VERSION || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        endpoint: "POST /bfhl",
        security: {
            helmet: "enabled",
            rateLimit: "100 requests per 15 minutes"
        }
    });
});

// Handle 404 errors
app.use('*', (req, res) => {
    res.status(404).json({
        is_success: false,
        message: `Route ${req.originalUrl} not found`,
        available_routes: ['/bfhl']
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        is_success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Graceful shutdown handlers
const shutDown = (signal) => {
    console.log(`\n🔌 Received ${signal}. Shutting down gracefully...`);
    
    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }
        
        console.log('✅ HTTP server closed');
        console.log('👋 Process terminated gracefully');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => shutDown('SIGTERM'));
process.on('SIGINT', () => shutDown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 API available at: http://localhost:${PORT}/bfhl`);
    console.log(`🛡️  Security: Helmet enabled, Rate limiting active`);
    console.log(`📊 Logging: ${process.env.NODE_ENV === 'production' ? 'Combined' : 'Dev'} format`);
    
    // Log environment status (don't log sensitive values in production)
    if (process.env.NODE_ENV === 'development') {
        console.log(`👤 User ID configured: ${process.env.USER_ID ? 'Yes' : 'No'}`);
        console.log(`📧 Email configured: ${process.env.EMAIL ? 'Yes' : 'No'}`);
        console.log(`🎓 Roll Number configured: ${process.env.ROLL_NUMBER ? 'Yes' : 'No'}`);
    }
    
    console.log(`\n📝 Press Ctrl+C to stop the server gracefully`);
});
