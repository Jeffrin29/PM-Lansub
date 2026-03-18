'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/discussionController');
const { authenticate } = require('../middleware/authenticate');
const { organizationIsolation } = require('../middleware/organizationIsolation');

router.use(authenticate, organizationIsolation);

router.get('/comments/latest',     ctrl.getLatestComments);
router.get('/',                    ctrl.getDiscussions);
router.post('/',                   ctrl.createDiscussion);
router.get('/:id',                 ctrl.getDiscussion);
router.post('/:id/comments',       ctrl.addComment);

module.exports = router;
