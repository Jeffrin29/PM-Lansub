const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { upload, handleMulterError } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { createProjectValidation, updateProjectValidation } = require('../middleware/validators');

// All project routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// ─── GET /api/projects — list projects ───────────────────────────────────────
router.get('/', projectController.getProjects);

// ─── POST /api/projects — create project ─────────────────────────────────────
router.post('/', createProjectValidation, validate, projectController.createProject);

// ─── GET /api/projects/:id — get project by id ───────────────────────────────
router.get('/:id', projectController.getProjectById);

// ─── PUT /api/projects/:id — update project ───────────────────────────────────
router.put('/:id', updateProjectValidation, validate, projectController.updateProject);

// ─── DELETE /api/projects/:id — delete project ───────────────────────────────
router.delete('/:id', projectController.deleteProject);

// ─── POST /api/projects/:id/attachments — upload attachment ──────────────────
router.post(
  '/:id/attachments',
  upload.single('file'),
  handleMulterError,
  projectController.uploadAttachment
);

module.exports = router;
