// src/routes/authRoutes.js — Rutas de autenticación
const { Router }                  = require('express');
const { register, login, getMe }  = require('../controller/authController');
const { authMiddleware }          = require('../middlewares/authMiddleware');

const router = Router();

// Rutas PÚBLICAS — no requieren token
router.post('/register', register); // POST /api/auth/register
router.post('/login',    login);    // POST /api/auth/login

// Ruta PROTEGIDA — requiere JWT válido
router.get('/me', authMiddleware, getMe); // GET /api/auth/me

module.exports = router;