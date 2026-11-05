// routes/carritos.routes.js
// Recurso 6: Carritos de Compra (Almacenado en Redis - Base Clave-Valor)
const express = require('express');
const router = express.Router();
const {
  setClave,
  getClave,
  listarClavesPorPatron
} = require('../config/redis');

// 1. GET: Listar todos los carritos activos
router.get('/', async (req, res) => {
  try {
    const claves = await listarClavesPorPatron('carrito:*');
    const incluirTodos = req.query.todos === 'true';
    const lista = [];

    for (const k of claves) {
      const data = await getClave(k);
      if (data) {
        if (incluirTodos || data.activo === true) {
          lista.push(data);
        }
      }
    }

    res.json({
      motor: 'Redis (Clave-Valor)',
      total: lista.length,
      data: lista
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener el carrito de un usuario
router.get('/:usuario_id', async (req, res) => {
  const clave = `carrito:${req.params.usuario_id}`;

  try {
    const data = await getClave(clave);
    if (!data) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    res.json({ motor: 'Redis (Clave-Valor)', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear o inicializar carrito de compras
router.post('/', async (req, res) => {
  const { usuario_id, items } = req.body;
  if (!usuario_id) {
    return res.status(400).json({ error: 'Campo requerido: usuario_id' });
  }

  const itemsArray = items || [];
  const total = itemsArray.reduce((acc, it) => acc + ((it.precio || 0) * (it.cantidad || 1)), 0);

  const nuevoCarrito = {
    usuario_id,
    items: itemsArray,
    total: Math.round(total * 100) / 100,
    activo: true, // Borrado logico
    creado_en: new Date().toISOString()
  };

  const clave = `carrito:${usuario_id}`;

  try {
    await setClave(clave, nuevoCarrito);
    res.status(201).json({
      mensaje: 'Carrito guardado exitosamente en Redis',
      clave,
      total: nuevoCarrito.total,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial del carrito (agregar items, cambiar cantidad, etc.)
router.patch('/:usuario_id', async (req, res) => {
  const clave = `carrito:${req.params.usuario_id}`;

  try {
    const dataActual = await getClave(clave);
    if (!dataActual) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const dataActualizada = {
      ...dataActual,
      ...req.body
    };

    // Si actualizaron items, recalculamos el total
    if (req.body.items && Array.isArray(req.body.items)) {
      const nuevoTotal = req.body.items.reduce((acc, it) => acc + ((it.precio || 0) * (it.cantidad || 1)), 0);
      dataActualizada.total = Math.round(nuevoTotal * 100) / 100;
    }

    dataActualizada.actualizado_en = new Date().toISOString();

    await setClave(clave, dataActualizada);
    res.json({
      mensaje: 'Carrito actualizado exitosamente en Redis',
      usuario_id: req.params.usuario_id,
      total: dataActualizada.total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE: Borrado logico del carrito (marca activo: false)
router.delete('/:usuario_id', async (req, res) => {
  const clave = `carrito:${req.params.usuario_id}`;

  try {
    const dataActual = await getClave(clave);
    if (!dataActual) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    // Borrado logico: No se elimina la clave, se marca activo: false
    dataActual.activo = false;
    dataActual.vaciado_en = new Date().toISOString();

    await setClave(clave, dataActual);
    res.json({
      mensaje: 'Borrado logico realizado con exito en Redis (activo = false)',
      usuario_id: req.params.usuario_id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
