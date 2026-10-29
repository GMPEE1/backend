const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

// POST /api/auth/login
// Login user
// Body: { email, password }
// Response: { success, accessToken, user: { id, name, email, role } }
// Roles: all
//http://localhost:7000/api/auth/login
router.post('/login', ctrl.login);

module.exports = router;
