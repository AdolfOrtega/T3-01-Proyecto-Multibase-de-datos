// consola.js
// Menu interactivo de consola para interactuar en vivo con el Web Service Multibase
// Adolfo Rodriguez & Andrea Tairi Velazquez Gallardo

const readline = require('readline');

const BASE_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function preguntar(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta.trim());
    });
  });
}

function pausa() {
  return preguntar('\nPresiona ENTER para continuar...');
}

async function menuPrincipal() {
  while (true) {
    console.clear();
    console.log('----------------------------------------------------');
    console.log('   SISTEMA INTERACTIVO - MULTIBASE DE DATOS (REST)  ');
    console.log('   Adolfo Rodriguez & Andrea Velazquez - 7mo Sem    ');
    console.log('----------------------------------------------------');
    console.log('  [ MySQL - BASE RELACIONAL ]');
    console.log('    1. Listar usuarios activos (GET)');
    console.log('    2. Registrar nuevo usuario (POST)');
    console.log('    3. Borrado logico de usuario (DELETE)');
    console.log('----------------------------------------------------');
    console.log('  [ MongoDB - BASE NOSQL DOCUMENTAL ]');
    console.log('    4. Listar productos activos (GET)');
    console.log('    5. Registrar nuevo producto (POST)');
    console.log('    6. Borrado logico de producto (DELETE)');
    console.log('----------------------------------------------------');
    console.log('  [ Redis - BASE CLAVE-VALOR ]');
    console.log('    7. Listar sesiones activas (GET)');
    console.log('    8. Registrar nueva sesion (POST)');
    console.log('    9. Borrado logico de sesion (DELETE)');
    console.log('----------------------------------------------------');
    console.log('    0. Salir');
    console.log('----------------------------------------------------');

    const opcion = await preguntar('Selecciona una opcion (0-9): ');

    try {
      switch (opcion) {
        case '1':
          await listarUsuarios();
          break;
        case '2':
          await crearUsuario();
          break;
        case '3':
          await borrarUsuario();
          break;
        case '4':
          await listarProductos();
          break;
        case '5':
          await crearProducto();
          break;
        case '6':
          await borrarProducto();
          break;
        case '7':
          await listarSesiones();
          break;
        case '8':
          await crearSesion();
          break;
        case '9':
          await borrarSesion();
          break;
        case '0':
          console.log('\nSaliendo del programa... Chao Chao.');
          rl.close();
          return;
        default:
          console.log('\n[!] Opcion no valida.');
          await pausa();
      }
    } catch (error) {
      console.log(`\n[!] Error de conexion: ${error.message}`);
      console.log('Asegurate de que el servidor este encendido con "npm start" en la otra ventana.');
      await pausa();
    }
  }
}

// ----------------------------------------------------
// 1. MODULO MYSQL (Usuarios)
// ----------------------------------------------------
async function listarUsuarios() {
  console.log('\n--- Consultando usuarios activos en MySQL (GET) ---');
  const res = await fetch(`${BASE_URL}/api/usuarios`);
  const json = await res.json();

  if (!json.data || json.data.length === 0) {
    console.log('No hay usuarios activos registrados.');
  } else {
    console.log(`Total encontrados: ${json.total}\n`);
    json.data.forEach((u) => {
      console.log(`- ID: ${u.id} | Nombre: ${u.nombre} | Email: ${u.email} | Rol: ${u.rol} | Activo: ${u.activo ? 'SI' : 'NO'}`);
    });
  }
  await pausa();
}

async function crearUsuario() {
  console.log('\n--- Registrar nuevo usuario en MySQL (POST) ---');
  const nombre = await preguntar('Escribe el Nombre: ');
  const email = await preguntar('Escribe el Email: ');
  const rol = await preguntar('Escribe el Rol (admin / cliente / docente) [Default: cliente]: ') || 'cliente';

  if (!nombre || !email) {
    console.log('[!] El nombre y el email son obligatorios.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, rol })
  });

  const json = await res.json();
  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}. (ID generado: ${json.id})`);
  } else {
    console.log(`\n[!] Error al crear: ${json.error}`);
  }
  await pausa();
}

async function borrarUsuario() {
  console.log('\n--- Borrado logico de usuario en MySQL (DELETE) ---');
  const id = await preguntar('Escribe el ID del usuario a borrar: ');

  if (!id) {
    console.log('[!] Debes ingresar un ID.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/usuarios/${id}`, { method: 'DELETE' });
  const json = await res.json();

  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}`);
    console.log('El registro no se borro del disco, solo se marco como inactivo (activo = false).');
  } else {
    console.log(`\n[!] Error: ${json.error}`);
  }
  await pausa();
}

// ----------------------------------------------------
// 2. MODULO MONGODB (Productos)
// ----------------------------------------------------
async function listarProductos() {
  console.log('\n--- Consultando productos activos en MongoDB (GET) ---');
  const res = await fetch(`${BASE_URL}/api/productos`);
  const json = await res.json();

  if (!json.data || json.data.length === 0) {
    console.log('No hay productos activos registrados.');
  } else {
    console.log(`Total encontrados: ${json.total}\n`);
    json.data.forEach((p) => {
      console.log(`- ID: ${p._id} | Producto: ${p.nombre} | Categoria: ${p.categoria} | Precio: $${p.precio} | Stock: ${p.stock}`);
    });
  }
  await pausa();
}

async function crearProducto() {
  console.log('\n--- Registrar nuevo producto en MongoDB (POST) ---');
  const nombre = await preguntar('Nombre del producto: ');
  const categoria = await preguntar('Categoria (ej. Electronica, Computo): ') || 'General';
  const precioStr = await preguntar('Precio (ej. 1250.50): ');
  const stockStr = await preguntar('Stock disponible: ') || '1';

  const precio = parseFloat(precioStr);
  const stock = parseInt(stockStr);

  if (!nombre || isNaN(precio)) {
    console.log('[!] Nombre y precio valido son obligatorios.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, categoria, precio, stock })
  });

  const json = await res.json();
  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}. (ObjectId Mongo: ${json._id})`);
  } else {
    console.log(`\n[!] Error al crear: ${json.error}`);
  }
  await pausa();
}

async function borrarProducto() {
  console.log('\n--- Borrado logico de producto en MongoDB (DELETE) ---');
  const id = await preguntar('Escribe el ID del producto (ObjectId) a borrar: ');

  if (!id) {
    console.log('[!] Debes ingresar un ID.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/productos/${id}`, { method: 'DELETE' });
  const json = await res.json();

  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}`);
    console.log('El documento sigue en MongoDB, pero con activo: false.');
  } else {
    console.log(`\n[!] Error: ${json.error}`);
  }
  await pausa();
}

// ----------------------------------------------------
// 3. MODULO REDIS (Sesiones)
// ----------------------------------------------------
async function listarSesiones() {
  console.log('\n--- Consultando sesiones activas en Redis (GET) ---');
  const res = await fetch(`${BASE_URL}/api/sesiones`);
  const json = await res.json();

  if (!json.data || json.data.length === 0) {
    console.log('No hay sesiones activas en Redis.');
  } else {
    console.log(`Total encontradas: ${json.total}\n`);
    json.data.forEach((s) => {
      console.log(`- Token: ${s.token} | Usuario ID: ${s.usuario_id} | IP: ${s.ip} | Navegador: ${s.navegador}`);
    });
  }
  await pausa();
}

async function crearSesion() {
  console.log('\n--- Registrar nueva sesion en Redis (POST) ---');
  const usuario_id = await preguntar('ID del Usuario (ej. 1, 5): ');
  const ip = await preguntar('Direccion IP (Default: 127.0.0.1): ') || '127.0.0.1';
  const navegador = await preguntar('Dispositivo / Navegador (ej. Chrome Windows): ') || 'Chrome Windows';

  if (!usuario_id) {
    console.log('[!] El ID de usuario es obligatorio.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/sesiones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario_id: Number(usuario_id), ip, navegador })
  });

  const json = await res.json();
  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}. (Token generado: ${json.token})`);
  } else {
    console.log(`\n[!] Error al crear: ${json.error}`);
  }
  await pausa();
}

async function borrarSesion() {
  console.log('\n--- Borrado logico de sesion en Redis (DELETE) ---');
  const token = await preguntar('Escribe el Token de la sesion a invalidar: ');

  if (!token) {
    console.log('[!] Debes ingresar un token.');
    await pausa();
    return;
  }

  const res = await fetch(`${BASE_URL}/api/sesiones/${token}`, { method: 'DELETE' });
  const json = await res.json();

  if (res.ok) {
    console.log(`\n[OK] ${json.mensaje}`);
  } else {
    console.log(`\n[!] Error: ${json.error}`);
  }
  await pausa();
}

// Iniciar consola interactiva
menuPrincipal();
