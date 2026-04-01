// src/controller/productController.js — CRUD completo de productos con filtros
const { Product, Category } = require('../models');
const { Op }                = require('sequelize');

/**
 * GET /api/products
 * Soporta búsqueda dinámica via query params:
 *   ?search=jabón  ?category=2  ?minPrice=100  ?maxPrice=5000
 */
async function getAll(req, res, next) {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const where = {};

    if (search)    where.nombre     = { [Op.iLike]: `%${search}%` };
    if (category)  where.categoryId = category;
    if (minPrice || maxPrice) {
      where.precio = {};
      if (minPrice) where.precio[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.precio[Op.lte] = parseFloat(maxPrice);
    }

    const products = await Product.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
      order:   [['nombre', 'ASC']],
    });

    res.json({
      status:  'success',
      message: `Se encontraron ${products.length} productos.`,
      data:    products,
    });
  } catch (err) { next(err); }
}

/** GET /api/products/:id */
async function getById(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'category' }],
    });

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado.', data: null });
    }

    res.json({ status: 'success', message: 'Producto encontrado.', data: product });
  } catch (err) { next(err); }
}

/** POST /api/products — Crea un producto (solo admin) */
async function create(req, res, next) {
  try {
    const { nombre, descripcion, precio, stock, fechaVencimiento, categoryId } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({
        status: 'error', message: 'Nombre y precio son obligatorios.', data: null,
      });
    }

    const product = await Product.create({
      nombre,
      descripcion,
      precio,
      stock:            stock || 0,
      fechaVencimiento: fechaVencimiento || null,
      categoryId:       categoryId || null,
    });

    res.status(201).json({ status: 'success', message: 'Producto creado.', data: product });
  } catch (err) { next(err); }
}

/**
 * PUT /api/products/:id — Actualiza un producto.
 * Se actualizan únicamente los campos enviados (evita sobrescribir datos no enviados).
 */
async function update(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado.', data: null });
    }

    await product.update(req.body);
    res.json({ status: 'success', message: 'Producto actualizado.', data: product });
  } catch (err) { next(err); }
}

/** DELETE /api/products/:id — Elimina un producto (solo admin) */
async function remove(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado.', data: null });
    }

    await product.destroy();
    res.json({ status: 'success', message: 'Producto eliminado.', data: null });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };