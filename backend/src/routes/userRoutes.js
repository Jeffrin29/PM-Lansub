const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { authorize, requireOrgAdmin } = require('../middleware/authorize');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { validate } = require('../middleware/validate');
const { createUserValidation, updateUserValidation } = require('../middleware/validators');

// All user routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// ─── GET /api/users — list users (org-scoped) ─────────────────────────────────
router.get('/', userController.getUsers);

// ─── GET /api/users/:id — get user by id ─────────────────────────────────────
router.get('/:id', userController.getUserById);

// ─── GET /api/users/:id/sessions — get user sessions ─────────────────────────
router.get('/:id/sessions', requireOrgAdmin, userController.getUserSessions);

// ─── POST /api/users — create user (org admin only) ──────────────────────────
router.post(
  '/',
  requireOrgAdmin,
  createUserValidation,
  validate,
  userController.createUser
);

// ─── PUT /api/users/:id — update user (org admin only) ───────────────────────
router.put(
  '/:id',
  requireOrgAdmin,
  updateUserValidation,
  validate,
  userController.updateUser
);

// ─── DELETE /api/users/:id — delete user (org admin only) ────────────────────
router.delete('/:id', requireOrgAdmin, userController.deleteUser);

module.exports = router;
