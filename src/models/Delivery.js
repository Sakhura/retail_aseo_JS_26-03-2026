// src/models/Delivery.js — Entrega asociada a una orden (relación 1:1 con Order)
// Solo existe cuando tipoEntrega === 'despacho'.
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  estado: {
    type:         DataTypes.ENUM('preparando', 'en_camino', 'entregado', 'fallido'),
    defaultValue: 'preparando',
  },
  direccion: {
    type:      DataTypes.STRING(255),
    allowNull: false,
  },
  fechaEstimada: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
    field:     'fecha_estimada',
  },
  observaciones: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  // FK única: cada orden tiene máximo un delivery (relación 1:1)
  orderId: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true,
    field:     'order_id',
    references: { model: 'orders', key: 'id' },
  },
}, {
  tableName:  'deliveries',
  timestamps: true,
});

module.exports = Delivery;