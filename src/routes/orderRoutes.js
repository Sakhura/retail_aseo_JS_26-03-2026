// src/routes/orderRoutes.js — Rutas de pedidos (todas PROTEGIDAS)
// Se protegen porque contienen información sensible del usuario
// y permiten modificar stock y datos de entrega.
const { Router } = require('express');
const ctrl       = require('../controller/orderController');
const { authMiddleware, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/',    ctrl.getAll);   // GET  /api/orders   (admin: todos | cliente: los suyos)
router.get('/:id', ctrl.getById);  // GET  /api/orders/:id
router.post('/',   ctrl.create);   // POST /api/orders   (crea pedido con transacción)

// Solo admin puede cambiar el estado del pedido
router.put('/:id/estado', requireRole('admin'), ctrl.updateEstado); // PUT /api/orders/:id/estado

module.exports = router;