// src/services/orderService.js — Lógica de negocio de pedidos
// Aquí vive la transacción completa: es la operación más crítica del sistema.
const { Order, OrderItem, Product, User, Delivery, sequelize } = require('../models');

async function findAll(userPayload) {
  const where = userPayload.rol === 'admin' ? {} : { userId: userPayload.id };

  return Order.findAll({
    where,
    include: [
      { model: User,      as: 'user',     attributes: ['id', 'nombre', 'email'] },
      { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product', attributes: ['id', 'nombre'] }] },
      { model: Delivery,  as: 'delivery' },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function findById(id, userPayload) {
  const order = await Order.findByPk(id, {
    include: [
      { model: User,      as: 'user',     attributes: ['id', 'nombre', 'email'] },
      { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product' }] },
      { model: Delivery,  as: 'delivery' },
    ],
  });

  if (!order) {
    const err = new Error('Pedido no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  // Un cliente solo puede ver sus propios pedidos
  if (userPayload.rol !== 'admin' && order.userId !== userPayload.id) {
    const err = new Error('Sin permisos para ver este pedido.');
    err.statusCode = 403;
    throw err;
  }

  return order;
}

/**
 * Crea un pedido dentro de una transacción atómica:
 *   1. Valida stock de cada producto
 *   2. Crea la Order
 *   3. Crea cada OrderItem
 *   4. Descuenta stock de cada Product
 *   5. Crea Delivery si tipoEntrega === 'despacho'
 * Si cualquier paso falla → ROLLBACK completo.
 */
async function createOrder({ items, tipoEntrega, direccionEntrega }, userId) {
  if (!items || items.length === 0) {
    const err = new Error('La orden debe tener al menos un producto.');
    err.statusCode = 400;
    throw err;
  }

  const t = await sequelize.transaction();

  try {
    // Paso 1: validar stock y calcular total
    let total = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });

      if (!product) {
        await t.rollback();
        const err = new Error(`Producto ID ${item.productId} no encontrado.`);
        err.statusCode = 404;
        throw err;
      }

      if (product.stock < item.cantidad) {
        await t.rollback();
        const err = new Error(`Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}.`);
        err.statusCode = 400;
        throw err;
      }

      total += parseFloat(product.precio) * item.cantidad;
      itemsData.push({ product, cantidad: item.cantidad });
    }

    // Paso 2: crear la Order
    const order = await Order.create({
      userId,
      total,
      tipoEntrega:      tipoEntrega || 'retiro',
      direccionEntrega: tipoEntrega === 'despacho' ? direccionEntrega : null,
    }, { transaction: t });

    // Pasos 3 y 4: crear ítems y descontar stock
    for (const { product, cantidad } of itemsData) {
      await OrderItem.create({
        orderId:        order.id,
        productId:      product.id,
        cantidad,
        precioUnitario: product.precio,
      }, { transaction: t });

      await product.update({ stock: product.stock - cantidad }, { transaction: t });
    }

    // Paso 5: crear Delivery si corresponde
    if (tipoEntrega === 'despacho' && direccionEntrega) {
      const estimada = new Date();
      estimada.setDate(estimada.getDate() + 3);

      await Delivery.create({
        orderId:       order.id,
        direccion:     direccionEntrega,
        estado:        'preparando',
        fechaEstimada: estimada.toISOString().split('T')[0],
      }, { transaction: t });
    }

    await t.commit(); // ✅ Todo OK — confirma los cambios

    // Recargar con todas las relaciones para la respuesta
    return Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product' }] },
        { model: Delivery,  as: 'delivery' },
      ],
    });
  } catch (err) {
    await t.rollback(); // ❌ Algo falló — deshace todo
    throw err;
  }
}

async function updateEstado(id, estado) {
  const order = await Order.findByPk(id);
  if (!order) {
    const err = new Error('Pedido no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return order.update({ estado });
}

module.exports = { findAll, findById, createOrder, updateEstado };