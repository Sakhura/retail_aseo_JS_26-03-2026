# 🧴 RetailAseo — Node & Express Web App

Proyecto integrador de los **módulos 6, 7 y 8** del programa Alkemy.  
Aplicación web backend para una tienda de artículos de higiene y limpieza, construida con **Node.js**, **Express**, **Sequelize** y **PostgreSQL**.

---

## 📋 Descripción general

RetailAseo es un sistema de gestión de tienda que permite:

- Servir un catálogo de productos con filtros dinámicos.
- Registrar y autenticar usuarios con JWT.
- Gestionar categorías y productos (CRUD completo).
- Crear pedidos con descuento de stock, control de tipo de entrega y transaccionalidad.
- Subir imágenes de productos y avatares de usuario.
- Registrar cada petición HTTP en un archivo de log.

---

## 🛠️ Stack técnico

| Tecnología     | Rol                                    |
|----------------|----------------------------------------|
| Node.js ≥ 18   | Runtime del servidor                   |
| Express 5      | Framework HTTP                         |
| Sequelize 6    | ORM para PostgreSQL                    |
| PostgreSQL      | Base de datos relacional               |
| bcryptjs        | Hash de contraseñas                    |
| jsonwebtoken    | Autenticación JWT                      |
| multer          | Subida de archivos                     |
| dotenv          | Gestión de variables de entorno        |
| nodemon         | Recarga automática en desarrollo       |

---

## 📁 Estructura de carpetas

```
retail_aseo/
├── app.js                   # Punto de entrada del servidor
├── .env                     # Variables de entorno (NO subir a git)
├── .gitignore
├── package.json
├── README.md
├── logs/
│   └── log.txt              # Registro de requests (Módulo 6)
├── uploads/                 # Imágenes subidas (Módulo 8)
├── public/                  # Archivos estáticos servidos por Express
│   ├── index.html           # Frontend SPA de la tienda
│   ├── css/styles.css
│   └── js/main.js           # Lógica del cliente
└── src/
    ├── config/
    │   ├── database.js      # Conexión Sequelize + PostgreSQL
    │   └── multer.js        # Configuración de subida de archivos
    ├── controller/
    │   ├── authController.js
    │   ├── categoryController.js
    │   ├── orderController.js
    │   ├── productController.js
    │   └── uploadController.js
    ├── middlewares/
    │   ├── authMiddleware.js   # Verificación JWT + control de roles
    │   ├── errorMiddleware.js  # Manejo centralizado de errores
    │   └── loggerMiddleware.js # Logging a archivo plano
    ├── models/
    │   ├── index.js         # Centraliza modelos y define asociaciones
    │   ├── User.js
    │   ├── Category.js
    │   ├── Product.js
    │   ├── Order.js
    │   ├── OrderItem.js
    │   └── Delivery.js
    └── routes/
        ├── index.js         # Router raíz
        ├── authRoutes.js
        ├── categoryRoutes.js
        ├── orderRoutes.js
        ├── productRoutes.js
        └── uploadRoutes.js
```

**Justificación de la estructura:** se separó en `routes`, `controller`, `middlewares`, `models` y `config` para seguir el patrón MVC y respetar el principio de responsabilidad única. Cada carpeta agrupa archivos por función, no por módulo del curso, lo que facilita escalar el proyecto.

---

## ⚙️ Requisitos del sistema

- **Node.js** v18 o superior
- **npm** v9 o superior
- **PostgreSQL** v14 o superior (corriendo localmente o en la nube)

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/retail_aseo_JS_26-03-2026.git
cd retail_aseo_JS_26-03-2026
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` (o edita `.env` directamente):

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=retail_aseo
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRETE=una_clave_secreta_muy_larga
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 4. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE retail_aseo;
```

Las tablas se crean automáticamente con `sequelize.sync({ alter: true })` al iniciar el servidor.

### 5. Iniciar el servidor

```bash
# Desarrollo con recarga automática (nodemon)
npm run dev

# Producción
npm start
```

El servidor quedará disponible en: `http://localhost:3000`

**Se usó `app.js` como archivo principal** porque centraliza toda la configuración de Express (middlewares, rutas, error handling) antes de que el servidor comience a escuchar, siguiendo la convención de proyectos Express en producción.

---

## 🔌 Endpoints de la API

### Base URL: `http://localhost:3000/api`

#### Autenticación (públicas)
| Método | Ruta               | Descripción                   |
|--------|--------------------|-------------------------------|
| POST   | /auth/register     | Registro de nuevo usuario     |
| POST   | /auth/login        | Login — devuelve JWT          |
| GET    | /auth/me 🔒        | Datos del usuario autenticado |

#### Categorías
| Método | Ruta                | Descripción               | Auth  |
|--------|---------------------|---------------------------|-------|
| GET    | /categories         | Listar (con ?search=)     | —     |
| GET    | /categories/:id     | Detalle con productos     | —     |
| POST   | /categories         | Crear categoría           | admin |
| PUT    | /categories/:id     | Actualizar categoría      | admin |
| DELETE | /categories/:id     | Eliminar categoría        | admin |

#### Productos
| Método | Ruta             | Descripción                                           | Auth  |
|--------|------------------|-------------------------------------------------------|-------|
| GET    | /products        | Listar (?search= ?category= ?minPrice= ?maxPrice=)    | —     |
| GET    | /products/:id    | Detalle con categoría                                 | —     |
| POST   | /products        | Crear producto                                        | admin |
| PUT    | /products/:id    | Actualizar producto                                   | admin |
| DELETE | /products/:id    | Eliminar producto                                     | admin |

#### Pedidos 🔒 (requieren JWT)
| Método | Ruta                    | Descripción                      |
|--------|-------------------------|----------------------------------|
| GET    | /orders                 | Lista pedidos (admin: todos)     |
| GET    | /orders/:id             | Detalle de un pedido             |
| POST   | /orders                 | Crear pedido (con transacción)   |
| PUT    | /orders/:id/estado      | Cambiar estado (solo admin)      |

#### Subida de archivos 🔒
| Método | Ruta                     | Descripción                    |
|--------|--------------------------|--------------------------------|
| POST   | /upload/avatar           | Subir foto de perfil           |
| POST   | /upload/product/:id      | Subir imagen de producto (admin)|

---

## 🔐 Autenticación con JWT

1. Obtén el token haciendo `POST /api/auth/login` o `POST /api/auth/register`.
2. En todas las rutas protegidas envía el header:
   ```
   Authorization: Bearer <tu_token>
   ```
3. El token expira en **24 horas** (configurable en `.env` con `JWT_EXPIRES_IN`).

**¿Por qué JWT?** Porque es stateless (no requiere almacenar sesiones en el servidor), portable entre servicios y estándar en APIs REST modernas.

---

## 📦 Scripts disponibles

| Comando       | Acción                                          |
|---------------|-------------------------------------------------|
| `npm run dev` | Inicia con nodemon (recarga al guardar cambios) |
| `npm start`   | Inicia en modo producción con node              |

**Justificación de scripts:** `dev` usa nodemon para acelerar el desarrollo. `start` usa node directamente para producción donde la estabilidad importa más que la recarga automática.

---

## 🗃️ Modelo de datos y relaciones

```
User ──────────── Order          (1:N — un usuario tiene muchos pedidos)
Category ──────── Product        (1:N — una categoría tiene muchos productos)
Order ─────────── OrderItem      (1:N — un pedido tiene muchos ítems)
Product ──────── OrderItem       (1:N — un producto aparece en muchos ítems)
Order ─────────── Delivery       (1:1 — un pedido tiene una entrega)
```

**Decisión de modelado:** se eligió una tabla `OrderItem` separada (en lugar de un array JSON) para poder hacer consultas filtradas por producto, calcular estadísticas de ventas y mantener el precio histórico de cada ítem.

---

## 📝 Registro de logs (Módulo 6)

Cada request recibido se registra automáticamente en `logs/log.txt` con el formato:

```
[28/03/2026 14:32:01] GET    /api/products — IP: ::1
[28/03/2026 14:32:05] POST   /api/auth/login — IP: ::1
[28/03/2026 14:32:09] POST   /api/orders — IP: ::1
```

Se usa `fs.appendFile()` para no bloquear el event loop y acumular el historial sin sobrescribir.

---

## 📎 Entregables por módulo

| Módulo | Carpeta Drive               | Contenido                                          |
|--------|-----------------------------|----------------------------------------------------|
| 6      | Parte 1 – Módulo 6          | Capturas servidor, rutas /, /status, log.txt       |
| 7      | Parte 2 – Módulo 7          | Capturas CRUD en Postman, modelos y relaciones     |
| 8      | Parte 3 – Módulo 8          | Capturas JWT, upload de archivos, rutas protegidas |

---

## 👤 Autor

Proyecto desarrollado para el programa JavaScript — Módulos 6, 7 y 8.