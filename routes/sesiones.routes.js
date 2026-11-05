// routes/sesiones.routes.js
// Recurso 5: Sesiones (Almacenado en Redis - Base Clave-Valor)
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const {
  setClave,
  getClave,
  eliminarClave,
  listarClavesPorPatron
} = require('../config/redis');

// 1. GET: Listar todas las sesiones activas
router.get('/', async (req, res) => {
  try {
    const claves = await listarClavesPorPatron('sesion:*');
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

// 2. GET: Obtener una sesion por Token
router.get('/:token', async (req, res) => {
  try {
    const clave = `sesion:${req.params.token}`;
    const data = await getClave(clave);

    if (!data) {
      return res.status(404).json({ error: 'Sesion no encontrada' });
    }

    res.json({ motor: 'Redis (Clave-Valor)', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: Crear nueva sesion de usuario
router.post('/', async (req, res) => {
  const { usuario_id, ip, navegador } = req.body;
  if (!usuario_id) {
    return res.status(400).json({ error: 'Campo requerido: usuario_id' });
  }

  // Generar un token aleatorio unico
  const token = req.body.token || crypto.randomBytes(16).toString('hex');
  const clave = `sesion:${token}`;

  const nuevaSesion = {
    token,
    usuario_id,
    ip: ip || req.ip || '127.0.0.1',
    navegador: navegador || req.headers['user-agent'] || 'Desconocido',
    activo: true, // Borrado logico
    creado_en: new Date().toISOString()
  };

  try {
    await setClave(clave, nuevaSesion);
    res.status(201).json({
      mensaje: 'Sesion creada exitosamente en Redis',
      token,
      activo: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PATCH: Actualizacion parcial de la sesion
router.patch('/:token', async (req, res) => {
  const clave = `sesion:${req.params.token}`;

  try {
    const dataActual = await getClave(clave);
    if (!dataActual) {
      return res.status(404).json({ error: 'Sesion no encontrada' });
    }

    // Fusionar cambios enviados
    const dataActualizada = {
      ...dataActual,
      ...req.body,
      actualizado_en: new Date().toISOString()
    };

    await setClave(clave, dataActualizada);
    res.json({
      mensaje: 'Sesion actualizada correctamente en Redis',
      token: req.params.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE: Borrado logico (Marca activo: false en la clave-valor)
router.delete('/:token', async (req, res) => {
  const clave = `sesion:${req.params.token}`;

  try {
    const dataActual = await getClave(clave);
    if (!dataActual) {
      return res.status(404).json({ error: 'Sesion no encontrada' });
    }

    // Borrado logico: No hacemos DEL en Redis, sino que marcamos activo = false
    dataActual.activo = false;
    dataActual.cerrado_en = new Date().toISOString();

    await setClave(clave, dataActual);
    res.json({
      mensaje: 'Borrado logico realizado con exito en Redis (activo = false)',
      token: req.params.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
