// src/controller/orderController.js — Gestión de pedidos con transacciones (Módulo 7 - Lección 4)
// Se usa una transacción para garantizar que la creación de la orden,
// sus ítems, el descuento de stock y el delivery se confirmen o anulen juntos.
const { Order, OrderItem, Product, User, Delivery, sequelize } = require('../models');

/** GET /api/orders — Admin ve todos los pedidos; cliente ve solo los suyos */
async function getAll(req, res, next) {
  try {
    const where = req.user.rol === 'admin' ? {} : { userId: req.user.id };

    const orders = await Order.findAll({
      where,
      include: [
        { model: User,      as: 'user',     attributes: ['id', 'nombre', 'email'] },
        { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product', attributes: ['id', 'nombre'] }] },
        { model: Delivery,  as: 'delivery' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ status: 'success', message: `${orders.length} pedidos encontrados.`, data: orders });
  } catch (err) { next(err); }
}

/** GET /api/orders/:id */
async function getById(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User,      as: 'user',     attributes: ['id', 'nombre', 'email'] },
        { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product' }] },
        { model: Delivery,  as: 'delivery' },
      ],
    });

    if (!order) return res.status(404).json({ status: 'error', message: 'Pedido no encontrado.', data: null });

    // Cliente solo puede ver sus propios pedidos
    if (req.user.rol !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Sin permisos para este pedido.', data: null });
    }

    res.json({ status: 'success', message: 'Pedido encontrado.', data: order });
  } catch (err) { next(err); }
}

/**
 * POST /api/orders
 * Crea el pedido dentro de una transacción:
 *   1. Valida stock de cada producto
 *   2. Crea la orden
 *   3. Crea cada OrderItem
 *   4. Descuenta stock
 *   5. Crea Delivery si es despacho
 * Si alguno de estos pasos falla → ROLLBACK completo.
 */
async function create(req, res, next) {
  const t = await sequelize.transaction(); // Inicia transacción

  try {
    const { items, tipoEntrega, direccionEntrega } = req.body;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ status: 'error', message: 'La orden debe tener al menos un producto.', data: null });
    }

    // Paso 1: verificar stock y calcular total
    let total = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });

      if (!product) {
        await t.rollback();
        return res.status(404).json({ status: 'error', message: `Producto ID ${item.productId} no encontrado.`, data: null });
      }
      if (product.stock < item.cantidad) {
        await t.rollback();
        return res.status(400).json({
          status:  'error',
          message: `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}.`,
          data:    null,
        });
      }

      total += parseFloat(product.precio) * item.cantidad;
      itemsData.push({ product, cantidad: item.cantidad });
    }

    // Paso 2: crear la orden
    const order = await Order.create({
      userId:           req.user.id,
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

    // Paso 5: crear delivery si corresponde
    if (tipoEntrega === 'despacho' && direccionEntrega) {
      const estimada = new Date();
      estimada.setDate(estimada.getDate() + 3); // estimado +3 días

      await Delivery.create({
        orderId:       order.id,
        direccion:     direccionEntrega,
        estado:        'preparando',
        fechaEstimada: estimada.toISOString().split('T')[0],
      }, { transaction: t });
    }

    await t.commit(); // ✅ Todo salió bien — confirma todos los cambios

    // Recargar con relaciones para la respuesta
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items',    include: [{ model: Product, as: 'product' }] },
        { model: Delivery,  as: 'delivery' },
      ],
    });

    res.status(201).json({ status: 'success', message: 'Pedido creado exitosamente.', data: fullOrder });
  } catch (err) {
    await t.rollback(); // ❌ Algo falló — deshace todos los cambios
    next(err);
  }
}

/** PUT /api/orders/:id/estado — Actualiza estado del pedido (solo admin) */
async function updateEstado(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Pedido no encontrado.', data: null });

    await order.update({ estado: req.body.estado });
    res.json({ status: 'success', message: 'Estado del pedido actualizado.', data: order });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, updateEstado };