const Joi = require('joi');

// Schema for the /bfhl endpoint based on PDF requirements
const bfhlSchema = Joi.object({
    data: Joi.array()
        .items(Joi.string().allow(''))  // Allow empty strings as they're valid input
        .required()                     // 'data' field is mandatory
        .min(1)                        // At least 1 item required
        .max(1000)                     // Prevent abuse with oversized arrays
        .messages({
            'array.base': 'Data must be an array',
            'array.empty': 'Data array cannot be empty',
            'array.min': 'Data array must contain at least 1 item',
            'array.max': 'Data array cannot contain more than 1000 items',
            'any.required': 'Data field is required'
        })
});

// Validation middleware function
const validateBfhl = (req, res, next) => {
    try {
        const { error, value } = bfhlSchema.validate(req.body, {
            abortEarly: false,    // Get all errors, not just the first one
            stripUnknown: true    // Remove any extra fields not in schema
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                is_success: false,
                message: 'Validation failed',
                errors: errorMessages
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
        
    } catch (err) {
        console.error('Validation error:', err);
        return res.status(500).json({
            is_success: false,
            message: 'Internal validation error'
        });
    }
};

module.exports = validateBfhl;
