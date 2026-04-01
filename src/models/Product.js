// src/models/Product.js — Modelo de Producto
// Artículos de higiene y limpieza disponibles en la tienda.
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  nombre: {
    type:      DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del producto no puede estar vacío.' },
    },
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  precio: {
    type:      DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'El precio no puede ser negativo.' },
    },
  },
  stock: {
    type:         DataTypes.INTEGER,
    allowNull:    false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'El stock no puede ser negativo.' },
    },
  },
  // Fecha de vencimiento relevante para productos de higiene
  fechaVencimiento: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
    field:     'fecha_vencimiento', // nombre de columna en BD
  },
  // Ruta de imagen subida via multer
  imagen: {
    type:      DataTypes.STRING(255),
    allowNull: true,
  },
  // FK hacia Category (relación 1:N)
  categoryId: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    field:     'category_id',
    references: { model: 'categories', key: 'id' },
  },
}, {
  tableName:  'products',
  timestamps: true,
});

module.exports = Product;