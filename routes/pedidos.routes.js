// routes/pedidos.routes.js
// Recurso 4: Pedidos / Ventas (Almacenado en MongoDB - Base NoSQL Documental)
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/mongodb');

function construirFiltroId(idParam) {
  if (ObjectId.isValid(idParam)) {
    return { _id: new ObjectId(idParam) };
  }
  return { id_pedido: isNaN(idParam) ? idParam : Number(idParam) };
}

// 1. GET: Listar todos los pedidos activos
router.get('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const incluirTodos = req.query.todos === 'true';
    const filtro = incluirTodos ? {} : { activo: true };

    const pedidos = await db.collection('pedidos').find(filtro).toArray();
    res.json({
      motor: 'MongoDB (NoSQL Documental)',
      total: pedidos.length,
      data: pedidos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener un pedido por ID
router.get('/:id', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const filtro = construirFiltroId(req.params.id);
    const pedido = await db.collection('pedidos').findOne(filtro);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ motor: 'MongoDB (NoSQL Documental)', data: pedido });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear pedido (incluye items embebidos y calculo de total)
router.post('/', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  const { cliente_id, items, metodo_pago } = req.body;
  if (!cliente_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Campos requeridos: cliente_id y arreglo de items' });
  }

  // Calcular el total a partir de los subtotales de cada item embebido
  const totalCalculado = items.reduce((acc, item) => {
    const subtotal = (item.precio || 0) * (item.cantidad || 1);
    item.subtotal = subtotal;
    return acc + subtotal;
  }, 0);

  const nuevoPedido = {
    cliente_id,
    items, // Arreglo de subdocumentos (ventaja de NoSQL)
    total: Math.round(totalCalculado * 100) / 100,
    metodo_pago: metodo_pago || 'efectivo',
    estado: 'pendiente',
    activo: true, // Borrado logico
    fecha: new Date()
  };

  try {
    const resultado = await db.collection('pedidos').insertOne(nuevoPedido);
    res.status(201).json({
      mensaje: 'Pedido registrado exitosamente en MongoDB',
      _id: resultado.insertedId,
      total: nuevoPedido.total,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial de pedido (estado, metodo de pago, items, etc.)
router.patch('/:id', async (req, res) => {
  const db = getDB();
  if (!db) return res.status(503).json({ error: 'Base de datos MongoDB no disponible' });

  try {
    const filtro = construirFiltroId(req.params.id);
    const camposActualizar = { ...req.body };
    delete camposActualizar._id;

    if (Object.keys(camposActualizar).length === 0) {
      return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
    }

    camposActualizar.actualizado_en = new Date();

    const resultado = await db.collection('pedidos').updateOne(
      filtro,
      { $set: camposActualizar }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ mensaje: 'Pedido actualizado exitosamente en MongoDB', id: req.params.id });
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
    const resultado = await db.collection('pedidos').updateOne(
      filtro,
      { $set: { activo: false, cancelado_en: new Date() } }
    );

    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
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
