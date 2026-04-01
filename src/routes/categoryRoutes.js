// src/routes/categoryRoutes.js — Rutas de categorías
const { Router }  = require('express');
const ctrl        = require('../controller/categoryController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Rutas PÚBLICAS — cualquiera puede consultar categorías
router.get('/',    ctrl.getAll);   // GET  /api/categories
router.get('/:id', ctrl.getById);  // GET  /api/categories/:id

// Rutas PROTEGIDAS — solo admin puede crear/editar/eliminar
router.post('/',    authMiddleware, requireRole('admin'), ctrl.create);  // POST   /api/categories
router.put('/:id',  authMiddleware, requireRole('admin'), ctrl.update);  // PUT    /api/categories/:id
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.remove); // DELETE /api/categories/:id

module.exports = router;