const { Category, Product } = require('../models');
const { Op }                = require('sequelize');
 
async function findAll({ search } = {}) {
  const where = {};
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
 
  return Category.findAll({
    where,
    include: [{ model: Product, as: 'products', attributes: ['id', 'nombre', 'precio', 'stock'] }],
    order:   [['nombre', 'ASC']],
  });
}
 
async function findById(id) {
  const category = await Category.findByPk(id, {
    include: [{ model: Product, as: 'products' }],
  });
 
  if (!category) {
    const err = new Error('Categoría no encontrada.');
    err.statusCode = 404;
    throw err;
  }
 
  return category;
}
 
async function createCategory({ nombre, descripcion }) {
  if (!nombre) {
    const err = new Error('El nombre es obligatorio.');
    err.statusCode = 400;
    throw err;
  }
  return Category.create({ nombre, descripcion });
}
 
async function updateCategory(id, data) {
  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error('Categoría no encontrada.');
    err.statusCode = 404;
    throw err;
  }
  return category.update(data);
}
 
async function deleteCategory(id) {
  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error('Categoría no encontrada.');
    err.statusCode = 404;
    throw err;
  }
  await category.destroy();
}
 
module.exports = { findAll, findById, createCategory, updateCategory, deleteCategory };