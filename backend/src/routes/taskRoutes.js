const express = require('express');
const router = express.Router();

const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { upload, handleMulterError } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { createTaskValidation, updateTaskValidation, commentValidation } = require('../middleware/validators');

// All task routes require authentication + org isolation
router.use(authenticate, organizationIsolation);

// ─── GET /api/tasks — list tasks (supports ?projectId=, ?status=, ?assignee=) ─
router.get('/', taskController.getTasks);

// ─── POST /api/tasks — create task ───────────────────────────────────────────
router.post('/', createTaskValidation, validate, taskController.createTask);

// ─── GET /api/tasks/:id — get task by id ─────────────────────────────────────
router.get('/:id', taskController.getTaskById);

// ─── PUT /api/tasks/:id — update task ─────────────────────────────────────────
router.put('/:id', updateTaskValidation, validate, taskController.updateTask);

// ─── DELETE /api/tasks/:id — delete task ─────────────────────────────────────
router.delete('/:id', taskController.deleteTask);

// ─── POST /api/tasks/:id/comments — add comment ──────────────────────────────
router.post('/:id/comments', commentValidation, validate, taskController.addComment);

// ─── POST /api/tasks/:id/attachments — upload attachment ─────────────────────
router.post(
  '/:id/attachments',
  upload.single('file'),
  handleMulterError,
  taskController.uploadAttachment
);

module.exports = router;
