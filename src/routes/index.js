// src/routes/index.js — Router raíz que monta todas las sub-rutas de la API
// Se decidió separar las rutas en archivos individuales por recurso
// para facilitar el mantenimiento y escalar el proyecto sin conflictos.
const { Router }   = require('express');
const authRoutes   = require('./authRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes  = require('./productRoutes');
const orderRoutes    = require('./orderRoutes');
const uploadRoutes   = require('./uploadRoutes');

const router = Router();

// Ruta de estado de la API
router.get('/', (req, res) => {
  res.json({
    status:  'success',
    message: 'API RetailAseo v1.0 — Lista para recibir peticiones',
    data: {
      endpoints: [
        'POST   /api/auth/register',
        'POST   /api/auth/login',
        'GET    /api/auth/me             [🔒 JWT]',
        'GET    /api/categories',
        'GET    /api/categories/:id',
        'POST   /api/categories          [🔒 admin]',
        'PUT    /api/categories/:id      [🔒 admin]',
        'DELETE /api/categories/:id      [🔒 admin]',
        'GET    /api/products',
        'GET    /api/products/:id',
        'POST   /api/products            [🔒 admin]',
        'PUT    /api/products/:id        [🔒 admin]',
        'DELETE /api/products/:id        [🔒 admin]',
        'GET    /api/orders              [🔒 JWT]',
        'GET    /api/orders/:id          [🔒 JWT]',
        'POST   /api/orders              [🔒 JWT]',
        'PUT    /api/orders/:id/estado   [🔒 admin]',
        'POST   /api/upload/avatar       [🔒 JWT]',
        'POST   /api/upload/product/:id  [🔒 admin]',
      ],
    },
  });
});

// Montaje de rutas
router.use('/auth',       authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products',   productRoutes);
router.use('/orders',     orderRoutes);
router.use('/upload',     uploadRoutes);

module.exports = router;