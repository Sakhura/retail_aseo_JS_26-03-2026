// src/middlewares/errorMiddleware.js — Manejo centralizado de errores de la API
// Intercepta todos los errores propagados con next(err) en los controladores.
// Todas las respuestas siguen el formato consistente: { status, message, data }
const { ValidationError, UniqueConstraintError } = require('sequelize');

/**
 * Error handler global — debe tener 4 parámetros para que Express lo reconozca.
 * Se registra como el último middleware en app.js.
 */
function errorMiddleware(err, req, res, next) {
  console.error('❌ Error capturado:', err.message);

  // Error de validación de Sequelize (campos requeridos, formato, etc.)
  if (err instanceof ValidationError) {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      status:  'error',
      message: 'Error de validación.',
      data:    messages,
    });
  }

  // Violación de restricción única (email duplicado, etc.)
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      status:  'error',
      message: 'Ya existe un registro con esos datos únicos.',
      data:    null,
    });
  }

  // Archivo demasiado grande (multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      status:  'error',
      message: 'El archivo supera el tamaño máximo permitido (5 MB).',
      data:    null,
    });
  }

  // Tipo de archivo no permitido (multer fileFilter)
  if (err.message?.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      status:  'error',
      message: err.message,
      data:    null,
    });
  }

  // Error genérico — usa el status del error si existe, o 500
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status:  'error',
    message: err.message || 'Error interno del servidor.',
    data:    null,
  });
}

module.exports = errorMiddleware;