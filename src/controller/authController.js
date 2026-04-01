// src/controller/authController.js — Registro e inicio de sesión de usuarios
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');

/**
 * POST /api/auth/register
 * Crea un nuevo usuario, hashea su contraseña y devuelve un JWT.
 */
async function register(req, res, next) {
  try {
    const { nombre, email, password, telefono } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({
        status:  'error',
        message: 'Nombre, email y contraseña son obligatorios.',
        data:    null,
      });
    }

    // Verificar duplicado ANTES de hashear (más eficiente)
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({
        status:  'error',
        message: 'El email ya está registrado.',
        data:    null,
      });
    }

    // Hashear contraseña — factor de costo 12 (buen balance seguridad/velocidad)
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      nombre,
      email,
      password: hashedPassword,
      telefono: telefono || null,
    });

    // Generar JWT con datos mínimos necesarios para identificar al usuario
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRETE,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      status:  'success',
      message: 'Usuario registrado exitosamente.',
      data: {
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      },
    });
  } catch (err) {
    next(err); // Delega al errorMiddleware
  }
}

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve un JWT si son correctas.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status:  'error',
        message: 'Email y contraseña son obligatorios.',
        data:    null,
      });
    }

    const user = await User.findOne({ where: { email } });

    // Mensaje genérico para no revelar si el email existe o no
    if (!user) {
      return res.status(401).json({
        status: 'error', message: 'Credenciales inválidas.', data: null,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        status: 'error', message: 'Credenciales inválidas.', data: null,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRETE,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      status:  'success',
      message: 'Inicio de sesión exitoso.',
      data: {
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, avatar: user.avatar },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me — Ruta PROTEGIDA
 * Devuelve los datos del usuario autenticado (sin contraseña).
 */
async function getMe(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }, // Nunca devolver el hash
    });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.', data: null });
    }

    res.json({ status: 'success', message: 'Datos del usuario autenticado.', data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };