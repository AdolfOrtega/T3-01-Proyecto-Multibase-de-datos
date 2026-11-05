// config/mongodb.js
// Conexion a la Base de Datos NoSQL Documental: MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DATABASE || 'multibase_db';

let db = null;
let client = null;

async function conectarMongoDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`[MongoDB] Conectado exitosamente a la base de datos NoSQL: ${dbName}`);
    return db;
  } catch (error) {
    console.error('[MongoDB] Error al conectar a MongoDB:', error.message);
    console.log('Recuerda tener MongoDB corriendo con: docker start mongodb');
    return null;
  }
}

function getDB() {
  return db;
}

module.exports = { conectarMongoDB, getDB };
