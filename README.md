# T3-01 Proyecto Multibase de Datos (Web Service REST)

**Instituto Tecnologico de Morelia**  
**Materia:** Topicos de Base de Datos (7mo Semestre)  
**Profesor:** Francisco Cervantes Zambrano  
**Integrantes:**
- Adolfo Rodriguez (No. Control: 23460528) - 23460528@colima.tecnm.mx
- Andrea Tairi Velazquez Gallardo (No. Control: 23460539) - 23460539@colima.tecnm.mx

---

## Descripcion del Proyecto

Este proyecto consiste en el desarrollo de una aplicacion **Multibase de Datos** implementada como un **Web Service REST** en **Node.js (Express)**. El sistema se conecta y opera simultaneamente con tres motores de bases de datos diferentes, cada uno perteneciente a un paradigma distinto:

1. **Base de Datos Relacional (SQL):** MySQL 8.0  
   - Manejo estructurado de tablas con integridad referencial y transacciones ACID.
2. **Base de Datos NoSQL Documental:** MongoDB  
   - Almacenamiento flexible en documentos JSON/BSON para catalogos y transacciones dinamicas.
3. **Base de Datos Clave-Valor:** Redis  
   - Acceso ultrarrapido en memoria RAM optimizado para sesiones volatiles y estados temporales (carritos).

La API expone **6 recursos independientes** que soportan todas las operaciones CRUD fundamentales mediante los verbos HTTP: **GET**, **POST**, **PATCH** y **DELETE**.

---

## Politica de Borrado Logico (Soft Delete)

Por especificacion del proyecto, **ningun registro se elimina fisicamente de la base de datos**. Al invocar el metodo `DELETE`:
- En **MySQL**: Se actualiza el campo booleano `activo = 0` (falso).
- En **MongoDB**: Se ejecuta un `$set: { activo: false }` sobre el documento.
- En **Redis**: Se actualiza el valor del JSON serializado con `"activo": false`.

De esta forma, las consultas `GET` de listado general filtran unicamente los registros vigentes (`activo = true` o `1`), conservando la trazabilidad, historial y auditoria en todas las bases de datos.

---

## Arquitectura de Recursos y Endpoints

El proyecto implementa **6 recursos** distribuidos en los tres motores:

| No. | Recurso | Motor | Paradigma | Ruta Base | Descripcion |
|---|---|---|---|---|---|
| 1 | **Usuarios** | MySQL | Relacional | `/api/usuarios` | Control de usuarios del sistema y roles de acceso. |
| 2 | **Clientes** | MySQL | Relacional | `/api/clientes` | Directorio de clientes comerciales y contactos. |
| 3 | **Productos** | MongoDB | Documental (NoSQL) | `/api/productos` | Catalogo de articulos, categorias y stock. |
| 4 | **Pedidos** | MongoDB | Documental (NoSQL) | `/api/pedidos` | Ordenes de compra con subdocumentos embebidos. |
| 5 | **Sesiones** | Redis | Clave-Valor | `/api/sesiones` | Tokens y sesiones activas en memoria de alta velocidad. |
| 6 | **Carritos** | Redis | Clave-Valor | `/api/carritos` | Carrito de compras temporal por usuario. |

---

## Metodos Implementados por Recurso

Todos los recursos cuentan con los 4 metodos HTTP requeridos:

### 1. Usuarios (`/api/usuarios`) - MySQL
- `GET /api/usuarios` - Obtiene todos los usuarios activos.
- `GET /api/usuarios/:id` - Obtiene un usuario especifico por su ID.
- `POST /api/usuarios` - Registra un nuevo usuario (`nombre`, `email`, `rol`).
- `PATCH /api/usuarios/:id` - Modifica campos del usuario (por ejemplo rol o email).
- `DELETE /api/usuarios/:id` - Marca al usuario como inactivo (`activo = 0`).

### 2. Clientes (`/api/clientes`) - MySQL
- `GET /api/clientes` - Lista de clientes comerciales activos.
- `GET /api/clientes/:id` - Detalle del cliente por ID.
- `POST /api/clientes` - Registra un cliente (`nombre`, `telefono`, `ciudad`).
- `PATCH /api/clientes/:id` - Actualiza informacion del cliente.
- `DELETE /api/clientes/:id` - Borrado logico del cliente (`activo = 0`).

### 3. Productos (`/api/productos`) - MongoDB
- `GET /api/productos` - Catalogo completo de productos disponibles.
- `GET /api/productos/:id` - Consulta producto por su `_id` de MongoDB.
- `POST /api/productos` - Inserta producto (`nombre`, `categoria`, `precio`, `stock`).
- `PATCH /api/productos/:id` - Ajusta precio, inventario o datos del producto.
- `DELETE /api/productos/:id` - Borrado logico (`activo: false`).

### 4. Pedidos (`/api/pedidos`) - MongoDB
- `GET /api/pedidos` - Listado de ordenes de compra vigentes.
- `GET /api/pedidos/:id` - Consulta pedido por `_id`.
- `POST /api/pedidos` - Genera una orden de compra con articulos anidados.
- `PATCH /api/pedidos/:id` - Cambia el estado del pedido (ej. pendiente a enviado).
- `DELETE /api/pedidos/:id` - Borrado logico de la orden.

### 5. Sesiones (`/api/sesiones`) - Redis
- `GET /api/sesiones` - Lista de sesiones activas en memoria.
- `GET /api/sesiones/:id` - Recupera la sesion por su token/clave.
- `POST /api/sesiones` - Guarda una nueva sesion (`usuario_id`, `token`, `ip`, `navegador`).
- `PATCH /api/sesiones/:id` - Actualiza la sesion (ej. IP o token).
- `DELETE /api/sesiones/:id` - Invalida la sesion logicamente (`activo: false`).

### 6. Carritos (`/api/carritos`) - Redis
- `GET /api/carritos` - Consulta todos los carritos activos.
- `GET /api/carritos/:id` - Obtiene el carrito de un usuario (`/api/carritos/1`).
- `POST /api/carritos` - Crea o inicializa un carrito de compras con items.
- `PATCH /api/carritos/:id` - Modifica productos o total del carrito.
- `DELETE /api/carritos/:id` - Borrado logico del carrito (`activo: false`).

---

## Requisitos Previos

1. **Node.js** (version 18 o superior).
2. **Docker** (para levantar contenedores de MySQL, MongoDB y Redis).
3. **Git** (para control de versiones).

---

## Instalacion y Configuracion

### Paso 1: Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd "T3-01 Proyecto Multibase de datos"
```

### Paso 2: Instalar las dependencias de Node.js
```bash
npm install
```

### Paso 3: Configurar variables de entorno
Copia el archivo `.env.example` como `.env`:
```bash
copy .env.example .env
```

El archivo `.env` contiene:
```env
PORT=3000

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=multibase_db

# MongoDB
MONGO_URI=mongodb://localhost:27017/multibase_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Paso 4: Levantar los motores con Docker
Levantar los tres contenedores:
```bash
docker-compose up -d
```
O si ya tienes una instancia de MongoDB corriendo:
```bash
docker-compose up -d mysql redis
```

---

## Ejecucion del Web Service

Para iniciar el servidor:
```bash
npm start
```

Salida esperada en consola:
```text
----------------------------------------------------
Iniciando Web Service Multibase de Datos...
----------------------------------------------------
[MySQL] Conectado exitosamente a la base de datos relacional.
[MongoDB] Conectado exitosamente a la base de datos NoSQL: multibase_db
[Redis] Conectado exitosamente al servidor Clave-Valor en localhost:6379
Servidor ejecutandose en http://localhost:3000
Presiona Ctrl+C para detener el servicio.
```

---

## Pruebas de la Aplicacion

### Menu interactivo en consola (Captura dinamica)
En una segunda terminal puedes iniciar la aplicacion interactiva para capturar, consultar y borrar datos en vivo:
```bash
npm run consola
# o bien: node consola.js
```

Tambien puedes realizar consultas directamente desde el navegador ingresando a:
- `http://localhost:3000/api/usuarios` (MySQL)
- `http://localhost:3000/api/productos` (MongoDB)
- `http://localhost:3000/api/sesiones` (Redis)

---

## Colaboradores y Commits en Git

- **Adolfo Rodriguez** - 23460528@colima.tecnm.mx (No. Control: 23460528)
- **Andrea Tairi Velazquez Gallardo** - 23460539@colima.tecnm.mx (No. Control: 23460539)

Para revisar el historial de commits en Git:
```bash
git log --oneline
```
