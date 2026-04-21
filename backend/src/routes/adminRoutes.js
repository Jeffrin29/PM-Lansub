'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');
const { checkRole } = require('../middleware/checkRole');

// All admin routes require authentication + org isolation + admin role
router.use(authenticate, organizationIsolation, checkRole('admin'));

router.get('/users',        ctrl.getUsers);
router.post('/users',       ctrl.createUser);
router.put('/users/:id',    ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;
