const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { user, User } = require("../models");

async function registerUser({ nombre, email, password, telefono }) {
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    const err = new Error("El email ya esta registrado");
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({
    nombre,
    email,
    password: hashedPassword,
    telefono: telefono || null,
  });
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    const err = new Error("Credenciales inválidas.");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function getUserById(id) {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    const err = new Error("Usuario no encontrado.");
    err.statusCode = 404;
    throw err;
  }

  return user;
}

//helpers
function generateToken(user){
    return jwt.sign(
        { id:user, email: user.email, rol: user.rol},
        process.env.JWT_SECRETE,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h'}
    );
}


function sanitizeUser(user){
    return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, avatar: user.avatar};
}

module.exports ={
    registerUser,
    loginUser,
    getUserById
};