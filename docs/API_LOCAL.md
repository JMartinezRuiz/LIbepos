# API local

LibrePOS expone una API local desde el mismo servidor Vite. Esta API esta pensada para el navegador de la app, no para consumo publico.

## Seguridad de acceso

- El middleware establece la cookie `librepos_sync` al servir la app.
- Las rutas `/api/*` requieren esa cookie.
- Las solicitudes con `Origin` solo se aceptan si el host coincide con el servidor.
- La API no debe exponerse a internet.

## Endpoints

| Metodo | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/access-info` | Devuelve URLs LAN detectadas para mostrar acceso desde otros dispositivos. |
| `POST` | `/api/login` | Valida usuario y contrasena contra el estado compartido. |
| `GET` | `/api/state` | Devuelve version y estado compartido actual. |
| `POST` | `/api/state` | Guarda estado compartido con control de version. |
| `GET` | `/api/events` | Stream SSE para notificar cambios a otros clientes. |
| `GET` | `/api/printers` | Lista impresoras instaladas en el equipo servidor. Requiere usuario admin. |
| `POST` | `/api/printers/test` | Envia un ticket de prueba a una impresora seleccionada. Requiere usuario admin. |
| `GET` | `/api/update/status` | Consulta si hay actualizacion disponible en GitHub. |
| `POST` | `/api/update/apply` | Descarga y aplica actualizacion desde GitHub. |

## `GET /api/access-info`

Respuesta:

```json
{
  "preferredUrl": "http://192.168.1.73:5173/",
  "urls": [
    "http://localhost:5173/",
    "http://192.168.1.73:5173/"
  ]
}
```

## `POST /api/login`

Solicitud:

```json
{
  "username": "admin",
  "password": "admin"
}
```

Respuesta exitosa:

```json
{
  "userId": "admin",
  "version": 123,
  "state": {}
}
```

Errores relevantes:

- `404 state-not-ready`: el servidor no tiene estado inicial.
- `401 invalid-login`: usuario o contrasena incorrectos.

## `GET /api/state`

Respuesta:

```json
{
  "version": 123,
  "state": {}
}
```

`state` es el estado publico. Los hashes y sales de contrasenas no se devuelven al navegador.

## `POST /api/state`

Solicitud:

```json
{
  "clientId": "client-abc",
  "baseVersion": 123,
  "state": {
    "settings": {},
    "users": [],
    "orders": [],
    "sales": [],
    "cancellations": [],
    "inventory": [],
    "ingredientCategories": [],
    "inventoryMovements": [],
    "expenses": [],
    "menuProducts": [],
    "extraCatalog": [],
    "attendance": [],
    "cashSessions": []
  }
}
```

Respuesta exitosa:

```json
{
  "version": 124,
  "state": {}
}
```

Errores relevantes:

- `400 missing-state`
- `400 invalid-users`
- `400 invalid-orders`
- `400 invalid-sales`
- `400 invalid-cancellations`
- `400 invalid-inventory`
- `400 invalid-ingredientCategories`
- `400 invalid-inventoryMovements`
- `400 invalid-expenses`
- `400 invalid-menuProducts`
- `400 invalid-extraCatalog`
- `400 invalid-attendance`
- `400 invalid-cashSessions`
- `400 invalid-settings`
- `400 missing-base-version`
- `409 version-mismatch`

Cuando hay `409`, la respuesta incluye `version` y `state` actuales para que el cliente intente fusionar y reintentar.

## `GET /api/events`

Abre un stream `text/event-stream`.

Eventos:

- `hello`: version y estado inicial al conectarse.
- `state`: nuevo estado compartido guardado por otro cliente.
- `ping`: latido cada 20 segundos.

El cliente usa polling a `/api/state` si `EventSource` no esta disponible o si el stream falla.

## `GET /api/printers`

Solicitud:

```text
/api/printers?userId=admin
```

Respuesta:

```json
{
  "printers": [
    {
      "name": "EPSON_TM_T20",
      "isDefault": true,
      "isTicketLikely": true,
      "source": "cups"
    }
  ],
  "platform": "darwin"
}
```

La lista sale del sistema operativo del equipo servidor. En macOS/Linux usa CUPS (`lpstat`) y en Windows usa PowerShell (`Win32_Printer`). Las impresoras Bluetooth aparecen si estan instaladas como impresoras del sistema.

Errores relevantes:

- `403 admin-required`

## `POST /api/printers/test`

Solicitud:

```json
{
  "userId": "admin",
  "printerName": "EPSON_TM_T20"
}
```

Respuesta exitosa:

```json
{
  "ok": true,
  "printerName": "EPSON_TM_T20",
  "printedAt": "2026-01-01T00:00:00.000Z"
}
```

Errores relevantes:

- `403 admin-required`
- `500 printer-print-failed`

## `GET /api/update/status`

Respuesta:

```json
{
  "available": true,
  "repoUrl": "https://github.com/JMartinezRuiz/LIbepos",
  "branch": "main",
  "projectPath": "",
  "localCommit": "abc123",
  "localSource": "git",
  "localIncludesRemote": false,
  "localUpdatedAt": "",
  "remoteCommit": "def456",
  "remoteUrl": "https://github.com/JMartinezRuiz/LIbepos/commit/def456",
  "remoteDate": "2026-01-01T00:00:00Z",
  "checkedAt": "2026-01-01T00:00:00.000Z"
}
```

## `POST /api/update/apply`

Respuesta cuando actualiza:

```json
{
  "updated": true,
  "filesUpdated": 25,
  "installRan": true,
  "installError": "",
  "restartRequired": true
}
```

Si los archivos ya se escribieron pero `npm install` falla, la respuesta sigue marcando `updated: true`, incluye `installError` y pide reiniciar. Esto evita que una actualizacion aplicada quede mostrando el boton por no haber escrito el marcador local de version.

Las descargas se hacen contra el SHA exacto del commit remoto y cada archivo se valida contra el hash reportado por GitHub para evitar contenido cacheado de una version anterior.

Respuesta cuando ya esta actualizado:

```json
{
  "updated": false,
  "filesUpdated": 0,
  "installRan": false,
  "restartRequired": false
}
```

Errores relevantes:

- `409 update-in-progress`
- `500 remote-version-not-found`
- `500 github-tree-not-found`
- `500 github-tree-truncated`
- `500 download-timeout`
- `500 unsafe-update-path`

## Estado compartido requerido

`POST /api/state` exige que estas propiedades existan y tengan el tipo correcto:

- `settings`: objeto.
- `users`: arreglo.
- `orders`: arreglo.
- `sales`: arreglo.
- `cancellations`: arreglo.
- `inventory`: arreglo.
- `ingredientCategories`: arreglo.
- `inventoryMovements`: arreglo.
- `expenses`: arreglo.
- `menuProducts`: arreglo.
- `extraCatalog`: arreglo.
- `attendance`: arreglo.
- `cashSessions`: arreglo.

Si agregas una nueva llave compartida en el frontend, tambien debes actualizar la validacion del servidor.
