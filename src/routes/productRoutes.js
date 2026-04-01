// src/routes/productRoutes.js — Rutas de productos
const { Router } = require('express');
const ctrl       = require('../controller/productController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Rutas PÚBLICAS — el catálogo es visible para todos
router.get('/',    ctrl.getAll);   // GET  /api/products          (con filtros ?search= ?category= ?minPrice= ?maxPrice=)
router.get('/:id', ctrl.getById);  // GET  /api/products/:id

// Rutas PROTEGIDAS — solo admin gestiona el inventario
router.post('/',      authMiddleware, requireRole('admin'), ctrl.create);  // POST   /api/products
router.put('/:id',    authMiddleware, requireRole('admin'), ctrl.update);  // PUT    /api/products/:id
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.remove);  // DELETE /api/products/:id

module.exports = router;