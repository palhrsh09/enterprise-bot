const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller.js');

router.get('/:id', users.getProfile);
router.put('/:id', users.updateProfile);
// router.delete('/:id', users.deleteusers);

module.exports = router;
