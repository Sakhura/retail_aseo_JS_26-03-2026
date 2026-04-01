// src/models/Order.js — Modelo de Pedido/Orden
// Registra cada compra realizada por un usuario.
const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  total: {
    type:         DataTypes.DECIMAL(10, 2),
    allowNull:    false,
    defaultValue: 0,
  },
  // Estado del ciclo de vida del pedido
  estado: {
    type: DataTypes.ENUM(
      'pendiente', 'confirmado', 'en_preparacion', 'enviado', 'entregado', 'cancelado'
    ),
    defaultValue: 'pendiente',
  },
  // Retiro en tienda o despacho a domicilio
  tipoEntrega: {
    type:      DataTypes.ENUM('retiro', 'despacho'),
    allowNull: false,
    field:     'tipo_entrega',
  },
  // Solo se llena si tipoEntrega === 'despacho'
  direccionEntrega: {
    type:      DataTypes.STRING(255),
    allowNull: true,
    field:     'direccion_entrega',
  },
  // FK hacia User (relación 1:N)
  userId: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    field:     'user_id',
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName:  'orders',
  timestamps: true,
});

module.exports = Order;