# EXAMEN F13 — Idempotencia y semántica de métodos HTTP

## Qué detecté y cómo lo arreglé

El proyecto usaba `PUT /:id` tanto en `client.routes.js` como en `project.routes.js`, pero los schemas de validación eran `createClientSchema.partial()` y `createProjectSchema.partial()` respectivamente. Esto significa que el servidor aceptaba actualizaciones parciales (sin todos los campos obligatorios) bajo un verbo que semánticamente promete reemplazar el recurso completo. La inconsistencia rompe el contrato REST y confunde a cualquier consumidor de la API.

**Solución adoptada**: cambiar ambas rutas de `PUT /:id` a `PATCH /:id`, alineando el verbo HTTP con el comportamiento real (actualización parcial). No fue necesario modificar los validators ni los controllers porque ya estaban implementados correctamente para actualizaciones parciales.

---

## Respuestas a las preguntas socráticas

### Pregunta 1
**¿Qué diferencia semántica hay entre un PUT con body parcial y un PATCH con body parcial? ¿Por qué importa esa distinción para una IA que consume tu API?**

`PUT` con body parcial es una contradicción: el estándar HTTP (RFC 7231) define `PUT` como una operación que reemplaza el recurso completo en el URI destino, de modo que los campos no enviados deben quedar a null o desaparecer. `PATCH` (RFC 5789), en cambio, está diseñado para modificar solo los campos incluidos en el body, dejando intactos el resto. Un `PUT` con body parcial viola el contrato de sustitución total, generando comportamiento ambiguo: ¿los campos omitidos se borran o se conservan?

Para una IA que consume la API, esta distinción es crítica. Si un agente automatizado interpreta `PUT` como sustitución total (como debe), enviará solo `{ name: "X" }` esperando que CIF y dirección queden vacíos; sin embargo, nuestra implementación los conserva. El agente recibe una respuesta que no coincide con su modelo mental del recurso, lo que puede llevar a decisiones erróneas en iteraciones posteriores o a un estado de datos corruptos desde la perspectiva del consumidor.

---

### Pregunta 2
**Si un cliente tiene CIF "A12345678" y haces un PUT con `{ name: "Nuevo Nombre" }` sin incluir el CIF, ¿Mongoose lanzaría un error de validación o lo actualizaría correctamente? ¿Por qué?**

Mongoose actualizaría correctamente solo el nombre sin lanzar ningún error, aunque `runValidators: true` esté activo. Esto ocurre porque `runValidators` en operaciones de actualización (`findOneAndUpdate`) aplica las validaciones únicamente sobre los campos que se están modificando en esa operación, no sobre el documento completo. El campo `cif` no forma parte del update payload, así que Mongoose no lo valida en absoluto. Esta es una diferencia fundamental respecto a la validación en `create`, donde todos los campos `required` se comprueban siempre.

El comportamiento es intencionado en Mongoose para permitir actualizaciones parciales eficientes, pero tiene como consecuencia que `runValidators` no puede sustituir a una validación explícita de presencia de todos los campos cuando se usa `PUT` real. Para hacer `PUT` verdaderamente idempotente habría que validar en Zod (no en Mongoose) que todos los campos obligatorios están presentes.

---

### Pregunta 3
**En `updateProject`, verificas que el cliente pertenece a la compañía `if (req.body.client)`. ¿Ese check es suficiente para garantizar la integridad multi-tenant o hay un edge case en el que podría fallar?**

El check es correcto para la mayoría de los casos, pero existe un edge case de TOCTOU (Time of Check vs Time of Use). La secuencia es: (1) se verifica que el cliente existe y pertenece a la compañía, (2) se llama a `findOneAndUpdate` sobre el proyecto. Entre esos dos pasos, otro proceso concurrente podría hacer soft-delete del cliente o reasignarlo. La actualización del proyecto en (2) no re-verifica la existencia del cliente, por lo que el proyecto podría quedar apuntando a un cliente que ya está eliminado o que dejó de pertenecer a la compañía.

Además, en un `PUT` idempotente que siempre incluye `client`, si el cliente es eliminado entre la primera y segunda llamada, la primera PUT tendría éxito y la segunda fallaría con 404, lo que rompe la idempotencia prometida por el verbo. Con `PATCH`, este comportamiento es aceptable porque PATCH no tiene garantía de idempotencia por especificación.

---

### Pregunta 4
**Si un consumidor repite exactamente la misma petición `PATCH /api/client/:id` con el mismo body diez veces en diez segundos, ¿el estado final debería ser el mismo que tras la primera? ¿Qué ocurriría con `updatedAt`?**

Los campos de negocio (`name`, `cif`, `email`, etc.) serán idénticos en todas las respuestas: esto es la idempotencia de facto a nivel de datos de dominio. Sin embargo, `updatedAt` cambia en cada llamada porque Mongoose actualiza automáticamente ese campo en cada operación de escritura, independientemente de si los datos cambiaron o no.

Técnicamente, RFC 7231 define idempotencia como "el efecto previsto en el servidor es el mismo independientemente de cuántas veces se aplique la petición". Cambiar solo `updatedAt` sin alterar datos de negocio entra en una zona gris: el recurso en Mongo ha sido tocado (hay un write con una nueva timestamp), pero la representación lógica del cliente es la misma. En la práctica, para los consumidores que cachean recursos por `updatedAt` o `ETag`, esta variación sí representa un problema real de idempotencia, porque cada llamada invalida la caché del consumidor. La solución para mitigarlo sería comparar el documento antes de escribir y omitir el update si no hay cambios, pero añade complejidad que no compensa en la mayoría de casos.

---

### Pregunta 5
**Compara la inmutabilidad de albaranes firmados con la mutabilidad de clientes. ¿Qué principio REST justifica tratarlos de forma diferente?**

El principio REST que justifica esta diferencia es el respeto al ciclo de vida y las invariantes del dominio del recurso. REST no impone que todos los recursos sean mutables del mismo modo: el diseño de los endpoints debe reflejar las reglas de negocio reales de cada tipo de recurso.

Los albaranes firmados son documentos legales con valor probatorio; su inmutabilidad post-firma es un requisito del dominio (y posiblemente legal), no una limitación técnica. En REST esto se modela correctamente omitiendo `PUT` y `PATCH` para el recurso una vez que ha alcanzado el estado `signed`. Los clientes, en cambio, son datos administrativos que evolucionan legítimamente (cambian de dirección, de CIF por fusiones, etc.), por lo que su mutabilidad controlada mediante `PATCH` es correcta.

Este contraste ilustra el principio de que la semántica HTTP debe diseñarse recurso a recurso basándose en las invariantes del dominio, no aplicarse uniformemente a toda la API. Forzar `PUT/PATCH` en un albarán firmado violaría la integridad del sistema; eliminar `PATCH` en clientes haría la API inutilizable.

---

## Proceso

**Tiempo invertido**: ~45 minutos en total.

**Detección del problema**: Al revisar `src/routes/client.routes.js` y `src/routes/project.routes.js`, identifiqué `router.put('/:id', ...)` con validators que usaban `.partial()`. La inconsistencia verbo/comportamiento era inmediata: `PUT` promete sustitución total, `.partial()` implementa actualización parcial.

**Decisión de diseño**: Elegí la opción 1 (cambiar a `PATCH`) en lugar de hacer `PUT` verdaderamente idempotente porque el comportamiento actual (parcial) es el correcto para este dominio. Convertir a `PUT` real habría requerido que todos los campos de `name`, `cif`, `email`, `phone`, `address` fueran obligatorios, lo que es innecesariamente restrictivo para una API de gestión empresarial.

**Cambios realizados**:
- `src/routes/client.routes.js`: `router.put` → `router.patch`, Swagger actualizado
- `src/routes/project.routes.js`: `router.put` → `router.patch`, Swagger actualizado
- `tests/client.test.js`: tests actualizados a `api.patch()`, añadido test de idempotencia
- `tests/project.test.js`: tests actualizados a `api.patch()`

**Herramientas**: Claude Code (CLI), editor de código, Jest para verificar tests.

**Prompts utilizados**: No se usaron prompts de IA generativa para generar código; los cambios se realizaron con comprensión directa del problema planteado.
