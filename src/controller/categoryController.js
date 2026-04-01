// src/controller/categoryController.js — CRUD de categorías de productos
const { Category, Product } = require('../models');
const { Op }                = require('sequelize');

/** GET /api/categories — Lista todas las categorías con sus productos */
async function getAll(req, res, next) {
  try {
    const { search } = req.query; // Búsqueda dinámica por nombre
    const where = {};
    if (search) where.nombre = { [Op.iLike]: `%${search}%` }; // iLike = case-insensitive

    const categories = await Category.findAll({
      where,
      include: [{
        model:      Product,
        as:         'products',
        attributes: ['id', 'nombre', 'precio', 'stock'],
      }],
      order: [['nombre', 'ASC']],
    });

    res.json({ status: 'success', message: `${categories.length} categorías encontradas.`, data: categories });
  } catch (err) { next(err); }
}

/** GET /api/categories/:id — Devuelve una categoría con todos sus productos */
async function getById(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Product, as: 'products' }],
    });

    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Categoría no encontrada.', data: null });
    }

    res.json({ status: 'success', message: 'Categoría encontrada.', data: category });
  } catch (err) { next(err); }
}

/** POST /api/categories — Crea una nueva categoría (solo admin) */
async function create(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        status: 'error', message: 'El nombre es obligatorio.', data: null,
      });
    }

    const category = await Category.create({ nombre, descripcion });
    res.status(201).json({ status: 'success', message: 'Categoría creada.', data: category });
  } catch (err) { next(err); }
}

/** PUT /api/categories/:id — Actualiza una categoría existente */
async function update(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Categoría no encontrada.', data: null });
    }

    // Se actualizan solo los campos que llegan en el body (PATCH-style)
    await category.update(req.body);
    res.json({ status: 'success', message: 'Categoría actualizada.', data: category });
  } catch (err) { next(err); }
}

/** DELETE /api/categories/:id — Elimina una categoría (solo admin) */
async function remove(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Categoría no encontrada.', data: null });
    }

    await category.destroy();
    res.json({ status: 'success', message: 'Categoría eliminada.', data: null });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };