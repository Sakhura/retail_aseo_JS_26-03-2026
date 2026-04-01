// src/routes/uploadRoutes.js — Rutas de subida de archivos (Módulo 8 - Lección 3)
// Todas las rutas son PROTEGIDAS: no tiene sentido subir archivos sin identificarse.
const { Router }  = require('express');
const upload      = require('../config/multer');
const ctrl        = require('../controller/uploadController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas requieren token JWT válido
router.use(authMiddleware);

// POST /api/upload/avatar — El usuario autenticado sube su foto de perfil
// "avatar" es el nombre del campo en el form multipart
router.post('/avatar', upload.single('avatar'), ctrl.uploadAvatar);

// POST /api/upload/product/:id — Admin sube/reemplaza imagen de un producto
// "imagen" es el nombre del campo en el form multipart
router.post(
  '/product/:id',
  requireRole('admin'),
  upload.single('imagen'),
  ctrl.uploadProductImage
);

module.exports = router;