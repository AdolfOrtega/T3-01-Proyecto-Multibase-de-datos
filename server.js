// server.js
// Servidor Principal - Web Service Multibase de Datos
// Materia: Topicos de Base de Datos
// Equipo: Adolfo Rodriguez & Andrea Tairi Velazquez Gallardo

const express = require('express');
require('dotenv').config();

// Modulos de conexion a los 3 motores de base de datos
const { conectarMySQL } = require('./config/mysql');
const { conectarMongoDB } = require('./config/mongodb');
const { conectarRedis } = require('./config/redis');

// Rutas de los 6 recursos
const usuariosRoutes = require('./routes/usuarios.routes');
const clientesRoutes = require('./routes/clientes.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const sesionesRoutes = require('./routes/sesiones.routes');
const carritosRoutes = require('./routes/carritos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar respuestas JSON con formato ordenado y legible (JSON Pretty)
app.set('json spaces', 2);

// Middleware para procesar JSON en el cuerpo de las peticiones
app.use(express.json());

// Ruta raiz con documentacion de los endpoints
app.get('/', (req, res) => {
  res.json({
    proyecto: 'Web Service Multibase de Datos',
    asignatura: 'Topicos de Base de Datos - 7mo Semestre',
    equipo: ['Adolfo Rodriguez', 'Andrea Tairi Velazquez Gallardo'],
    motores_implementados: {
      relacional: 'MySQL (Tablas: usuarios, clientes)',
      no_sql_documental: 'MongoDB (Colecciones: productos, pedidos)',
      clave_valor: 'Redis (Estructuras: sesiones, carritos)'
    },
    recursos_disponibles: [
      { recurso: '/api/usuarios', motor: 'MySQL', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] },
      { recurso: '/api/clientes', motor: 'MySQL', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] },
      { recurso: '/api/productos', motor: 'MongoDB', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] },
      { recurso: '/api/pedidos', motor: 'MongoDB', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] },
      { recurso: '/api/sesiones', motor: 'Redis', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] },
      { recurso: '/api/carritos', motor: 'Redis', metodos: ['GET', 'POST', 'PATCH', 'DELETE'] }
    ],
    borrado_logico: 'Activo en todos los recursos (campo activo = true/false)'
  });
});

// Registrar las rutas de los 6 recursos
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/carritos', carritosRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Inicializar conexiones e iniciar servidor
async function iniciarServidor() {
  console.log('----Iniciando Web Service Multibase de Datos...');

  // 1. Conectar a MySQL
  await conectarMySQL();

  // 2. Conectar a MongoDB
  await conectarMongoDB();

  // 3. Conectar a Redis
  await conectarRedis();

  app.listen(PORT, () => {
    console.log('Presiona Ctrl+C para detener el servicio.\n');
  });
}

iniciarServidor();
