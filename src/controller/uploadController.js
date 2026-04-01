// src/controller/uploadController.js — Subida de archivos e imagen de productos (Módulo 8)
// Multer ya validó el tipo y tamaño antes de llegar aquí.
const { User, Product } = require('../models');

/**
 * POST /api/upload/avatar — Sube una imagen y la asocia al perfil del usuario.
 * Campo del form: "avatar" (multipart/form-data)
 */
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se recibió ningún archivo.', data: null });
    }

    // Ruta pública accesible desde el navegador (servida por /uploads)
    const avatarUrl = `/uploads/${req.file.filename}`;

    await User.update({ avatar: avatarUrl }, { where: { id: req.user.id } });

    res.json({
      status:  'success',
      message: 'Avatar actualizado exitosamente.',
      data: {
        url:      avatarUrl,
        filename: req.file.filename,
        size:     req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/upload/product/:id — Sube imagen y la asocia al producto indicado (solo admin).
 * Campo del form: "imagen" (multipart/form-data)
 */
async function uploadProductImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se recibió ningún archivo.', data: null });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado.', data: null });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    await product.update({ imagen: imageUrl });

    res.json({
      status:  'success',
      message: 'Imagen del producto actualizada.',
      data: {
        productId: product.id,
        imageUrl,
        filename:  req.file.filename,
        size:      req.file.size,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { uploadAvatar, uploadProductImage };