// src/models/Category.js — Modelo de Categoría de productos
// Agrupa productos (ej: Jabones, Detergentes, Desinfectantes).
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  nombre: {
    type:      DataTypes.STRING(80),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre de la categoría no puede estar vacío.' },
    },
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName:  'categories',
  timestamps: true,
});

module.exports = Category;