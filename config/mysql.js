// config/mysql.js
// Conexion a la Base de Datos Relacional: MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function conectarMySQL() {
  try {
    // 1. Primero conectamos sin especificar la base de datos para asegurarnos de que exista
    const conexionInicial = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root'
    });

    const dbName = process.env.MYSQL_DATABASE || 'multibase_db';
    await conexionInicial.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await conexionInicial.end();

    // 2. Ahora creamos el Pool de conexiones a la base de datos del proyecto
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Crear las tablas necesarias si no existen (Recurso 1: usuarios, Recurso 2: clientes)
    await inicializarTablas();

    console.log('[MySQL] Conectado exitosamente a la base de datos relacional.');
    return pool;
  } catch (error) {
    console.error('[MySQL] No se pudo conectar a MySQL:', error.message);
    console.log('Asegurate de que el contenedor de MySQL este corriendo con: docker start multibase_mysql o docker-compose up -d');
    return null;
  }
}

async function inicializarTablas() {
  // Tabla 1: usuarios (con campo 'activo' para borrado logico)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      rol VARCHAR(50) DEFAULT 'cliente',
      activo BOOLEAN DEFAULT TRUE,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabla 2: clientes (con campo 'activo' para borrado logico)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT,
      telefono VARCHAR(20),
      direccion VARCHAR(200),
      ciudad VARCHAR(100),
      activo BOOLEAN DEFAULT TRUE,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `);
}

function getPool() {
  return pool;
}

module.exports = { conectarMySQL, getPool };
