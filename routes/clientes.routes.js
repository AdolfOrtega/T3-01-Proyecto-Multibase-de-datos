// routes/clientes.routes.js
// Recurso 2: Clientes (Almacenado en MySQL - Base Relacional)
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/mysql');

// 1. GET: Listar todos los clientes activos
router.get('/', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    const incluirTodos = req.query.todos === 'true';
    const query = incluirTodos
      ? `SELECT c.*, u.nombre AS usuario_nombre, u.email 
         FROM clientes c 
         LEFT JOIN usuarios u ON c.usuario_id = u.id`
      : `SELECT c.*, u.nombre AS usuario_nombre, u.email 
         FROM clientes c 
         LEFT JOIN usuarios u ON c.usuario_id = u.id 
         WHERE c.activo = TRUE`;

    const [clientes] = await pool.query(query);
    res.json({
      motor: 'MySQL (Relacional)',
      total: clientes.length,
      data: clientes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener un cliente por ID
router.get('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    const [filas] = await pool.query(
      `SELECT c.*, u.nombre AS usuario_nombre, u.email 
       FROM clientes c 
       LEFT JOIN usuarios u ON c.usuario_id = u.id 
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ motor: 'MySQL (Relacional)', data: filas[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear cliente (activo = TRUE)
router.post('/', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  const { usuario_id, telefono, direccion, ciudad } = req.body;

  try {
    const [resultado] = await pool.query(
      'INSERT INTO clientes (usuario_id, telefono, direccion, ciudad, activo) VALUES (?, ?, ?, ?, TRUE)',
      [usuario_id || null, telefono || '', direccion || '', ciudad || 'Colima']
    );

    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      id: resultado.insertId,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial de cliente
router.patch('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  const { usuario_id, telefono, direccion, ciudad, activo } = req.body;
  const updates = [];
  const valores = [];

  if (usuario_id !== undefined) { updates.push('usuario_id = ?'); valores.push(usuario_id); }
  if (telefono !== undefined) { updates.push('telefono = ?'); valores.push(telefono); }
  if (direccion !== undefined) { updates.push('direccion = ?'); valores.push(direccion); }
  if (ciudad !== undefined) { updates.push('ciudad = ?'); valores.push(ciudad); }
  if (activo !== undefined) { updates.push('activo = ?'); valores.push(activo); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  valores.push(req.params.id);

  try {
    const [resultado] = await pool.query(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`,
      valores
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ mensaje: 'Cliente actualizado correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE: Borrado logico de cliente (activo = FALSE)
router.delete('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    const [resultado] = await pool.query(
      'UPDATE clientes SET activo = FALSE WHERE id = ?',
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      mensaje: 'Borrado logico realizado con exito (activo = false)',
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
