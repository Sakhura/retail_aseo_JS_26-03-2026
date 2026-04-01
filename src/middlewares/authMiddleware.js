// src/middlewares/authMiddleware.js — Verifica el token JWT en rutas protegidas (Módulo 8)
// Se decidió proteger rutas de órdenes, uploads y gestión de datos
// porque exponen información sensible o permiten modificar la base de datos.
const jwt = require('jsonwebtoken');

/**
 * authMiddleware — Extrae y valida el JWT del header Authorization.
 * Si es válido, adjunta el payload decodificado a req.user y llama a next().
 * Si no, responde con 401 Unauthorized.
 *
 * El token se almacena en el cliente (localStorage o sessionStorage del navegador)
 * y se envía en cada petición protegida como: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Verifica que el header exista y tenga el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status:  'error',
      message: 'Acceso denegado. Se requiere token de autenticación.',
      data:    null,
    });
  }

  const token = authHeader.split(' ')[1]; // Extrae la parte después de "Bearer "

  try {
    // jwt.verify lanza excepción si el token es inválido o expiró
    const decoded = jwt.verify(token, process.env.JWT_SECRETE);
    req.user = decoded; // { id, email, rol, iat, exp }
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expirado. Por favor inicia sesión nuevamente.'
      : 'Token inválido.';

    return res.status(401).json({ status: 'error', message, data: null });
  }
}

/**
 * requireRole — Middleware de autorización por rol.
 * Uso: router.delete('/:id', authMiddleware, requireRole('admin'), handler)
 * @param {...string} roles — Roles permitidos ('admin', 'cliente')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        status:  'error',
        message: 'No tienes permisos para realizar esta acción.',
        data:    null,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };