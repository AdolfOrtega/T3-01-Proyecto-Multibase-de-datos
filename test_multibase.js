// --------------------------------------------------------
// Script automatizado de pruebas para los 6 recursos
// Multibase de Datos: MySQL, MongoDB y Redis
// Adolfo Rodriguez & Andrea Velazquez
// --------------------------------------------------------

const BASE_URL = 'http://localhost:3000';

async function probarTodo() {
  console.log('Iniciando pruebas de la API Multibase en', BASE_URL);
  console.log('--------------------------------------------------');

  try {
    // 0. Test raíz
    const resHome = await fetch(`${BASE_URL}/`);
    const homeJson = await resHome.json();
    console.log('[OK] Estado del Web Service:', homeJson.proyecto, '| Motores:', Object.keys(homeJson.motores_implementados).join(', '));

    // 1. MySQL: Usuarios
    console.log('\n--- 1. Probando MySQL: Usuarios ---');
    const postUsr = await fetch(`${BASE_URL}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Juan Pérez', email: 'juan.perez@test.com', rol: 'admin' })
    });
    const usrData = await postUsr.json();
    console.log('POST /api/usuarios:', usrData.mensaje, '| ID:', usrData.id);

    const getUsrs = await fetch(`${BASE_URL}/api/usuarios`);
    const usrsList = await getUsrs.json();
    console.log('GET /api/usuarios: Total activos =', usrsList.total);

    const patchUsr = await fetch(`${BASE_URL}/api/usuarios/${usrData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: 'supervisor' })
    });
    console.log('PATCH /api/usuarios:', (await patchUsr.json()).mensaje);

    const delUsr = await fetch(`${BASE_URL}/api/usuarios/${usrData.id}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/usuarios:', (await delUsr.json()).mensaje);

    // 2. MySQL: Clientes
    console.log('\n--- 2. Probando MySQL: Clientes ---');
    const postCli = await fetch(`${BASE_URL}/api/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Abarrotes El Sol', telefono: '443-777-8899', ciudad: 'Morelia' })
    });
    const cliData = await postCli.json();
    console.log('POST /api/clientes:', cliData.mensaje, '| ID:', cliData.id);

    const patchCli = await fetch(`${BASE_URL}/api/clientes/${cliData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad: 'Zamora' })
    });
    console.log('PATCH /api/clientes:', (await patchCli.json()).mensaje);

    const delCli = await fetch(`${BASE_URL}/api/clientes/${cliData.id}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/clientes:', (await delCli.json()).mensaje);

    // 3. MongoDB: Productos
    console.log('\n--- 3. Probando MongoDB: Productos ---');
    const postProd = await fetch(`${BASE_URL}/api/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Mouse Óptico Inalámbrico', categoria: 'Accesorios', precio: 350.00, stock: 20 })
    });
    const prodData = await postProd.json();
    const prodId = prodData._id;
    console.log('POST /api/productos:', prodData.mensaje, '| ID:', prodId);

    const patchProd = await fetch(`${BASE_URL}/api/productos/${prodId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precio: 299.99 })
    });
    console.log('PATCH /api/productos:', (await patchProd.json()).mensaje);

    const delProd = await fetch(`${BASE_URL}/api/productos/${prodId}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/productos:', (await delProd.json()).mensaje);

    // 4. MongoDB: Pedidos
    console.log('\n--- 4. Probando MongoDB: Pedidos ---');
    const postPed = await fetch(`${BASE_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: 1, items: [{ producto: 'Mouse Óptico', precio: 299.99, cantidad: 2 }] })
    });
    const pedData = await postPed.json();
    const pedId = pedData._id;
    console.log('POST /api/pedidos:', pedData.mensaje, '| ID:', pedId);

    const patchPed = await fetch(`${BASE_URL}/api/pedidos/${pedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'enviado' })
    });
    console.log('PATCH /api/pedidos:', (await patchPed.json()).mensaje);

    const delPed = await fetch(`${BASE_URL}/api/pedidos/${pedId}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/pedidos:', (await delPed.json()).mensaje);

    // 5. Redis: Sesiones
    console.log('\n--- 5. Probando Redis: Sesiones ---');
    const postSes = await fetch(`${BASE_URL}/api/sesiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: 1, ip: '192.168.1.1', navegador: 'Chrome' })
    });
    const sesData = await postSes.json();
    const token = sesData.token;
    console.log('POST /api/sesiones:', sesData.mensaje, '| Token:', token);

    const patchSes = await fetch(`${BASE_URL}/api/sesiones/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: '192.168.1.200' })
    });
    console.log('PATCH /api/sesiones:', (await patchSes.json()).mensaje);

    const delSes = await fetch(`${BASE_URL}/api/sesiones/${token}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/sesiones:', (await delSes.json()).mensaje);

    // 6. Redis: Carritos
    console.log('\n--- 6. Probando Redis: Carritos ---');
    const usrIdCarrito = 1;
    const postCart = await fetch(`${BASE_URL}/api/carritos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usrIdCarrito, items: [{ item: 'Teclado Gamer', precio: 500, cantidad: 1 }] })
    });
    const cartData = await postCart.json();
    console.log('POST /api/carritos:', cartData.mensaje, '| Clave:', cartData.clave);

    const patchCart = await fetch(`${BASE_URL}/api/carritos/${usrIdCarrito}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total: 750 })
    });
    console.log('PATCH /api/carritos:', (await patchCart.json()).mensaje);

    const delCart = await fetch(`${BASE_URL}/api/carritos/${usrIdCarrito}`, { method: 'DELETE' });
    console.log('DELETE (lógico) /api/carritos:', (await delCart.json()).mensaje);

    console.log('\n--------------------------------------------------');
    console.log('[OK] TODAS LAS PRUEBAS EN LOS 6 RECURSOS COMPLETADAS');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('Error durante las pruebas:', err.message);
  }
}

probarTodo();
