const { body } = require('express-validator');

// ─── Auth ─────────────────────────────────────────────────────────────────────
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('organizationName').optional().trim().isLength({ min: 2, max: 100 }),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number'),
];

// ─── User ─────────────────────────────────────────────────────────────────────
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roleId').notEmpty().withMessage('Role ID is required').isMongoId(),
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('roleId').optional().isMongoId(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
];

// ─── Project ──────────────────────────────────────────────────────────────────
const createProjectValidation = [
  body('projectTitle').trim().notEmpty().withMessage('Project title is required').isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['draft', 'active', 'review', 'completed', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('budget.allocated').optional().isNumeric().withMessage('Budget must be numeric'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
];

const updateProjectValidation = [
  body('projectTitle').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['draft', 'active', 'review', 'completed', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('completionPercentage').optional().isInt({ min: 0, max: 100 }),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
];

// ─── Task ─────────────────────────────────────────────────────────────────────
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 3, max: 300 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId(),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('assignee').optional().isMongoId(),
  body('estimatedHours').optional().isNumeric({ min: 0 }),
];

const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 300 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('assignee').optional().isMongoId(),
  body('loggedHours').optional().isNumeric({ min: 0 }),
];

// ─── Comment ──────────────────────────────────────────────────────────────────
const commentValidation = [
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 2000 }),
];

// ─── Role ─────────────────────────────────────────────────────────────────────
const createRoleValidation = [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  body('permissions').optional().isArray(),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshValidation,
  resetPasswordValidation,
  createUserValidation,
  updateUserValidation,
  createProjectValidation,
  updateProjectValidation,
  createTaskValidation,
  updateTaskValidation,
  commentValidation,
  createRoleValidation,
};
