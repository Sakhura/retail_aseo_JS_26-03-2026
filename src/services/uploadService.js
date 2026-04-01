// src/services/uploadService.js — Lógica de negocio de subida de archivos
const { User, Product } = require('../models');

/**
 * Asocia la imagen subida al perfil del usuario autenticado.
 * @param {number} userId - ID del usuario autenticado (req.user.id)
 * @param {string} filename - Nombre del archivo guardado por multer
 * @returns {object} datos del archivo guardado
 */
async function saveAvatar(userId, filename) {
  const avatarUrl = `/uploads/${filename}`;
  await User.update({ avatar: avatarUrl }, { where: { id: userId } });
  return { url: avatarUrl, filename };
}

/**
 * Asocia la imagen subida al producto indicado.
 * @param {number} productId - ID del producto
 * @param {object} file - Objeto file de multer (filename, size, mimetype)
 * @returns {object} datos del archivo y producto actualizado
 */
async function saveProductImage(productId, file) {
  const product = await Product.findByPk(productId);

  if (!product) {
    const err = new Error('Producto no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const imageUrl = `/uploads/${file.filename}`;
  await product.update({ imagen: imageUrl });

  return {
    productId: product.id,
    imageUrl,
    filename:  file.filename,
    size:      file.size,
    mimetype:  file.mimetype,
  };
}

module.exports = { saveAvatar, saveProductImage };