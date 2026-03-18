'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/users',      ctrl.getUsers);
router.post('/users',     ctrl.createUser);
router.put('/users/:id',  ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

module.exports = router;
