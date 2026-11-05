// config/redis.js
// Conexion a la Base de Datos Clave-Valor: Redis
const { createClient } = require('redis');
require('dotenv').config();

const host = process.env.REDIS_HOST || 'localhost';
const port = process.env.REDIS_PORT || 6379;

let redisClient = null;
let usandoFallbackMemoria = false;

// Fallback en memoria por si Redis no esta levantado en la maquina
const memoriaFallback = new Map();

async function conectarRedis() {
  try {
    redisClient = createClient({
      url: `redis://${host}:${port}`,
      socket: {
        connectTimeout: 2500
      }
    });

    redisClient.on('error', (err) => {
      // Si falla la conexion inicial, usamos el fallback en memoria
      if (!usandoFallbackMemoria) {
        console.warn('[Redis] Fallo la comunicacion con el servidor Redis. Activando emulador Clave-Valor en memoria.');
        usandoFallbackMemoria = true;
      }
    });

    await redisClient.connect();
    console.log(`[Redis] Conectado exitosamente al servidor Clave-Valor en ${host}:${port}`);
    return redisClient;
  } catch (error) {
    usandoFallbackMemoria = true;
    console.warn(`[Redis] No se pudo conectar a redis://${host}:${port}. Se activa almacenamiento Clave-Valor en memoria temporal.`);
    return null;
  }
}

// Funciones sencillas para abstraer las operaciones clave-valor
async function setClave(clave, valorObjeto) {
  const jsonString = JSON.stringify(valorObjeto);
  if (redisClient && redisClient.isReady) {
    await redisClient.set(clave, jsonString);
  } else {
    memoriaFallback.set(clave, jsonString);
  }
}

async function getClave(clave) {
  let jsonString = null;
  if (redisClient && redisClient.isReady) {
    jsonString = await redisClient.get(clave);
  } else {
    jsonString = memoriaFallback.get(clave) || null;
  }
  return jsonString ? JSON.parse(jsonString) : null;
}

async function eliminarClave(clave) {
  if (redisClient && redisClient.isReady) {
    await redisClient.del(clave);
  } else {
    memoriaFallback.delete(clave);
  }
}

async function listarClavesPorPatron(patron) {
  if (redisClient && redisClient.isReady) {
    return await redisClient.keys(patron);
  } else {
    const prefijo = patron.replace('*', '');
    const keys = [];
    for (const k of memoriaFallback.keys()) {
      if (k.startsWith(prefijo)) {
        keys.push(k);
      }
    }
    return keys;
  }
}

module.exports = {
  conectarRedis,
  setClave,
  getClave,
  eliminarClave,
  listarClavesPorPatron
};
