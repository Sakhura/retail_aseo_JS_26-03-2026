// src/services/productService.js — Lógica de negocio de productos
const { Product, Category } = require('../models');
const { Op }                = require('sequelize');

async function findAll({ search, category, minPrice, maxPrice } = {}) {
  const where = {};

  if (search)   where.nombre     = { [Op.iLike]: `%${search}%` };
  if (category) where.categoryId = category;

  if (minPrice || maxPrice) {
    where.precio = {};
    if (minPrice) where.precio[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.precio[Op.lte] = parseFloat(maxPrice);
  }

  return Product.findAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['id', 'nombre'] }],
    order:   [['nombre', 'ASC']],
  });
}

async function findById(id) {
  const product = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category' }],
  });

  if (!product) {
    const err = new Error('Producto no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  return product;
}

async function createProduct({ nombre, descripcion, precio, stock, fechaVencimiento, categoryId }) {
  if (!nombre || precio === undefined) {
    const err = new Error('Nombre y precio son obligatorios.');
    err.statusCode = 400;
    throw err;
  }

  return Product.create({
    nombre,
    descripcion,
    precio,
    stock:            stock || 0,
    fechaVencimiento: fechaVencimiento || null,
    categoryId:       categoryId || null,
  });
}

async function updateProduct(id, data) {
  const product = await Product.findByPk(id);
  if (!product) {
    const err = new Error('Producto no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  return product.update(data);
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) {
    const err = new Error('Producto no encontrado.');
    err.statusCode = 404;
    throw err;
  }
  await product.destroy();
}

module.exports = { findAll, findById, createProduct, updateProduct, deleteProduct };