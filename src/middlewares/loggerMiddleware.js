// src/middlewares/loggerMiddleware.js — Registra cada petición HTTP en logs/log.txt
// Implementa la persistencia en archivos planos requerida en el Módulo 6 (Lección 5).
// Se usa fs.appendFile para agregar líneas sin sobrescribir el historial.
const fs   = require('fs');
const path = require('path');

// Asegura que la carpeta logs/ exista al iniciar la aplicación
const logsDir = path.join(__dirname, '../../logs');
const logFile = path.join(logsDir, 'log.txt');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Middleware de logging: escribe una línea por cada request recibido.
 * Formato: [DD/MM/YYYY HH:MM:SS] MÉTODO /ruta
 */
function loggerMiddleware(req, res, next) {
  const now   = new Date();
  const fecha = now.toLocaleDateString('es-CL');  // DD/MM/YYYY
  const hora  = now.toLocaleTimeString('es-CL');   // HH:MM:SS
  const ip    = req.ip || req.connection.remoteAddress || 'desconocida';
  const linea = `[${fecha} ${hora}] ${req.method.padEnd(6)} ${req.originalUrl} — IP: ${ip}\n`;

  // Escritura asíncrona — no bloquea el event loop del servidor
  fs.appendFile(logFile, linea, (err) => {
    if (err) console.error('⚠️  Error escribiendo log:', err.message);
  });

  next(); // Continúa la cadena de middlewares
}

module.exports = loggerMiddleware;