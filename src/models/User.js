// src/models/User.js — Modelo de Usuario
// Representa a los clientes y administradores de la tienda.
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  nombre: {
    type:      DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío.' },
      len:      { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres.' },
    },
  },
  email: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    unique:    { msg: 'Este email ya está registrado.' },
    validate: {
      isEmail: { msg: 'Debe ingresar un email válido.' },
    },
  },
  // La contraseña se almacena hasheada con bcryptjs, nunca en texto plano
  password: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  telefono: {
    type:      DataTypes.STRING(20),
    allowNull: true,
  },
  // Rol determina los permisos: 'admin' puede gestionar productos/categorías
  rol: {
    type:         DataTypes.ENUM('admin', 'cliente'),
    defaultValue: 'cliente',
  },
  // Ruta de la imagen de perfil subida con multer
  avatar: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName:  'users',
  timestamps: true, // createdAt y updatedAt automáticos
});

module.exports = User;