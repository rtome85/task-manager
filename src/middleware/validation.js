const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = {};
        errors.array().forEach(error => {
            if (!formattedErrors[error.path]) {
                formattedErrors[error.path] = []
            }
            formattedErrors[error.path].push(error.msg);
        });

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }
    next();
};

// Auth validation rules
const validateRegister = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Task validation rules
const validateCreateTask = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title is required and must be less than 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('status')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('status')
        .optional()
        .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'])
        .withMessage('Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED'),
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid ISO 8601 date'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters'),
    handleValidationErrors
]

const validateUpdateTask = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Task ID must be a positive integer'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('status')
        .optional()
        .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .withMessage('Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED'),
    body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid ISO 8601 date'),
    handleValidationErrors
];

const validateTaskId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Task ID must be a positive integer'),
    handleValidationErrors
];

// Query validation for listing tasks
const validateTaskQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .withMessage('Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED'),
    query('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
        .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateCreateTask,
    validateUpdateTask,
    validateTaskId,
    validateTaskQuery,
};