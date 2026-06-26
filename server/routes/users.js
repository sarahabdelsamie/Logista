const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { roleGuard } = require('../middleware/roleMiddleware');

const adminOnly = roleGuard(['Admin']);

router.get('/', protect, adminOnly, getUsers);
router.post('/', protect, adminOnly, createUser);
router.get('/:id', protect, adminOnly, getUser);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
