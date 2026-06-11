const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth_controller/authController');
const authenticateToken = require('../../middleware/authmiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);


module.exports = router;