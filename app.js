// app.js — Punto de entrada de RetailAseo (Módulo 6, 7 y 8)
// Se usa app.js como nombre principal porque centraliza toda la configuración
// de Express antes de que el servidor escuche peticiones.
require('dotenv').config(); // Carga variables desde .env ANTES que cualquier otra cosa

const express = require('express');
const path    = require('path');

const { sequelize }       = require('./src/models');
const routes              = require('./src/routes');
const loggerMiddleware    = require('./src/middlewares/loggerMiddleware');
const errorMiddleware     = require('./src/middlewares/errorMiddleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ─────────────────────────────────────────────────
app.use(express.json());                         // Parsea body JSON
app.use(express.urlencoded({ extended: true })); // Parsea form-urlencoded
app.use(loggerMiddleware);                       // Registra cada request en logs/log.txt

// ── Archivos estáticos ───────────────────────────────────────────────────
// express.static sirve todo lo que esté dentro de /public
app.use(express.static(path.join(__dirname, 'public')));
// Carpeta uploads accesible vía /uploads (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rutas públicas base ──────────────────────────────────────────────────
// Ruta raíz: devuelve el HTML de la tienda
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta /status: estado del servidor en JSON (Módulo 6 - Lección 4)
app.get('/status', (req, res) => {
  res.json({
    status:      'ok',
    message:     'Servidor RetailAseo en funcionamiento',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version:     '1.0.0',
  });
});

// ── Rutas de la API (Módulo 7 y 8) ──────────────────────────────────────
app.use('/api', routes);

// ── Middleware de errores (debe ser el último) ───────────────────────────
app.use(errorMiddleware);

// ── Inicio del servidor con conexión a DB ────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();                 // Verifica credenciales de DB
    console.log('✅ Conexión a PostgreSQL establecida.');

    await sequelize.sync({ alter: true });          // Sincroniza modelos (sin borrar datos)
    console.log('✅ Modelos sincronizados con la base de datos.');

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado: http://localhost:${PORT}`);
      console.log(`📋 Estado:            http://localhost:${PORT}/status`);
      console.log(`🔌 API:               http://localhost:${PORT}/api`);
      console.log(`🌍 Entorno:           ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; // Exportado para posibles tests