// routes/productos.routes.js
// Recurso 3: Productos (Almacenado en MongoDB - Base NoSQL Documental)
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

function construirFiltroId(idParam) {
  if (ObjectId.isValid(idParam)) {
    return { _id: new ObjectId(idParam) };
  }
  // Si envian un id numerico o codigo de barras
  return { id: isNaN(idParam) ? idParam : Number(idParam) };
}

// 1. GET: Listar todos los productos activos
router.get('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const incluirTodos = req.query.todos === 'true';
    const filtro = incluirTodos ? {} : { activo: true };

    const productos = await db.collection('productos').find(filtro).toArray();
    res.json({
      motor: 'MongoDB (NoSQL Documental)',
      total: productos.length,
      data: productos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener un producto por ID
router.get('/:id', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const filtro = construirFiltroId(req.params.id);
    const producto = await db.collection('productos').findOne(filtro);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ motor: 'MongoDB (NoSQL Documental)', data: producto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear un nuevo producto (con subdocumentos y activo = true)
router.post('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  const { nombre, categoria, precio, stock, especificaciones } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, precio' });
  }

  const nuevoProducto = {
    nombre,
    categoria: categoria || 'General',
    precio: Number(precio),
    stock: stock !== undefined ? Number(stock) : 0,
    especificaciones: especificaciones || {}, // Caracteristica NoSQL: objetos anidados
    activo: true, // Borrado logico
    creado_en: new Date()
  };

  try {
    const resultado = await db.collection('productos').insertOne(nuevoProducto);
    res.status(201).json({
      mensaje: 'Producto creado exitosamente en MongoDB',
      _id: resultado.insertedId,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial del producto
router.patch('/:id', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const filtro = construirFiltroId(req.params.id);
    const camposActualizar = { ...req.body };
    delete camposActualizar._id; // Prevenir modificar el identificador nativo

    if (Object.keys(camposActualizar).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    }

    // Agregar fecha de actualizacion
    camposActualizar.actualizado_en = new Date();

    const resultado = await db.collection('productos').updateOne(
      filtro,
      { $set: camposActualizar }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto actualizado exitosamente en MongoDB', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE: Borrado logico (Marca activo: false)
router.delete('/:id', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const filtro = construirFiltroId(req.params.id);
    const resultado = await db.collection('productos').updateOne(
      filtro,
      { $set: { activo: false, eliminado_en: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      mensaje: 'Borrado logico realizado con exito en MongoDB (activo = false)',
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
