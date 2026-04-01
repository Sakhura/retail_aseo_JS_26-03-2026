const { Sequelize } = require('sequelize;');

const sequelize = new Sequelize(
process.env.DB_NAME,
process.env.DB_USER,
process.env.DB_PASSWORD,

{
    host:       process.env.DB_HOST || 'localhost',
    port:       parseInt(process.env.DB_PORT) || 5432,
    dialect:    'postgres',

    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    pool: {
      max:     5,      // Máximo de conexiones simultáneas en el pool
      min:     0,      // Mínimo de conexiones activas
      acquire: 30000,  // Tiempo máximo para obtener conexión (ms)
      idle:    10000,  // Tiempo antes de liberar conexión inactiva (ms)
    },
  }
);