# BildyApp API

Backend de la práctica final de Programación Web II. API REST para gestión de albaranes digitales entre empresas y clientes.

## Tecnologías

- Node.js + Express
- MongoDB + Mongoose
- JWT (access + refresh tokens)
- Socket.IO
- Docker + Docker Compose
- Swagger/OpenAPI 3.0
- Jest + Supertest + mongodb-memory-server
- Cloudinary (subida de imágenes y PDFs)
- Multer + Sharp
- PDFKit
- Nodemailer
- Slack Incoming Webhooks (errores 5XX)

## Instalación

```bash
npm install
```

Copia el `.env.example` a `.env` y rellena las variables:

```bash
cp .env.example .env
```

## Ejecución en local

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`.

## Documentación Swagger

Una vez arrancado el servidor, la documentación está disponible en:

```
http://localhost:3000/api-docs
```

## Docker

Para levantar la app junto con MongoDB en contenedores:

```bash
docker compose up --build
```

Esto levanta:
- La API en el puerto 3000
- Una instancia de MongoDB

Para parar y eliminar los contenedores:

```bash
docker compose down
```

## Tests

```bash
npm test
```

Cobertura:

```bash
npm run test:coverage
```

Los tests usan `mongodb-memory-server` así que no hace falta tener MongoDB instalado. Cada archivo de test levanta su propia base de datos en memoria y la destruye al terminar, por lo que se pueden pasar de forma individual sin que afecten a los demás:

```bash
npx jest tests/auth.test.js
npx jest tests/client.test.js
npx jest tests/project.test.js
npx jest tests/deliverynote.test.js
```

## Variables de entorno

Ver `.env.example` para la lista completa de variables necesarias.

## Endpoints principales

| Módulo | Base |
|--------|------|
| Usuarios | `/api/user` |
| Clientes | `/api/client` |
| Proyectos | `/api/project` |
| Albaranes | `/api/deliverynote` |
| Health check | `/api/health` |

Todos los endpoints (excepto registro y login) requieren el header:

```
Authorization: Bearer <token>
```
