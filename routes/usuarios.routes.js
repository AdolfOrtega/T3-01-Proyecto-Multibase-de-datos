// routes/usuarios.routes.js
// Recurso 1: Usuarios (Almacenado en MySQL - Base Relacional)
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/mysql');

// 1. GET: Listar todos los usuarios activos (Borrado logico: activo = TRUE)
router.get('/', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    // Si envian ?todos=true se muestran incluso los inactivos, por defecto solo activos
    const incluirTodos = req.query.todos === 'true';
    const query = incluirTodos 
      ? 'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios' 
      : 'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE activo = TRUE';

    const [usuarios] = await pool.query(query);
    res.json({
      motor: 'MySQL (Relacional)',
      total: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?', 
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ motor: 'MySQL (Relacional)', data: filas[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear un nuevo usuario (nace activo por defecto)
router.post('/', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Campos obligatorios: nombre, email' });
  }

  try {
    const pass = password || '123456';
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, TRUE)',
      [nombre, email, pass, rol || 'cliente']
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      id: resultado.insertId,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial de usuario
router.patch('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  const { nombre, email, password, rol, activo } = req.body;
  const updates = [];
  const valores = [];

  if (nombre !== undefined) { updates.push('nombre = ?'); valores.push(nombre); }
  if (email !== undefined) { updates.push('email = ?'); valores.push(email); }
  if (password !== undefined) { updates.push('password = ?'); valores.push(password); }
  if (rol !== undefined) { updates.push('rol = ?'); valores.push(rol); }
  if (activo !== undefined) { updates.push('activo = ?'); valores.push(activo); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  valores.push(req.params.id);

  try {
    const [resultado] = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      valores
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE: Borrado logico (Marca el registro como activo = FALSE, no lo borra del disco)
router.delete('/:id', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Base de datos MySQL no disponible' });

  try {
    const [resultado] = await pool.query(
      'UPDATE usuarios SET activo = FALSE WHERE id = ?',
      [req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
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
