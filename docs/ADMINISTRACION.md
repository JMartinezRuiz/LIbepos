# Administracion y mantenimiento

Esta guia es para quien instala, opera y mantiene el equipo servidor de LibrePOS.

## Requisitos

- Node.js LTS con `npm`.
- Navegador moderno.
- Red WiFi local para telefonos o tablets.
- Python 3 es opcional en macOS; los scripts `.command` lo usan si existe, pero pueden instalar con `npm` directamente si no esta disponible.

Windows usa los archivos `.bat` con Node.js/npm directamente.

## Instalacion

### macOS

1. Abre `Instalar LibrePOS.command`.
2. Si no hay Node.js/npm, instala Node.js LTS cuando se abra la pagina oficial.
3. Al terminar, abre `Abrir LibrePOS.command`.

### Windows

1. Abre `Instalar LibrePOS.bat`.
2. Si no hay Node.js/npm, instala Node.js LTS cuando se abra la pagina oficial.
3. Al terminar, abre `Abrir LibrePOS.bat`.

### Terminal

```bash
npm install
npm run build
npm start
```

## Arranque y apagado

- Para arrancar: abre el lanzador de tu sistema o ejecuta `npm start`.
- Para apagar: cierra la ventana del servidor o pulsa `Ctrl+C`.
- No apagues el equipo servidor mientras se estan registrando ventas.

LibrePOS escucha en `0.0.0.0:5173`, por eso otros dispositivos de la LAN pueden entrar por la IP del servidor.

## Archivos de datos

Los datos operativos se guardan en:

```text
.librepos/
```

Archivos importantes:

- `.librepos/state.json`: ventas, ordenes abiertas, usuarios, inventario, movimientos, extras, gastos, cortes y configuracion.
- `.librepos/sync-token`: token local usado por la cookie de acceso del servidor.
- `.librepos/app-version.json`: version tecnica instalada cuando se actualiza desde GitHub.

Carpetas y archivos generados que no se suben a Git:

- `node_modules/`
- `dist/`
- `.vite/`
- `.librepos/`
- `*.log`
- `__pycache__/`
- `*.pyc`

## Respaldos

Haz dos tipos de respaldo:

1. Respaldo operativo desde la app: entra como admin, ve a `Datos` y descarga `Respaldo JSON`.
2. Respaldo completo del servidor: con LibrePOS apagado, copia toda la carpeta `.librepos/` a una USB, disco externo o carpeta sincronizada segura.

El respaldo completo de `.librepos/` es el preferido para migrar o restaurar el sistema completo porque conserva hashes de contrasenas, token local y metadatos de version.

## Inventario y caja

- `Subir ticket` en Inventario crea un gasto de categoria `Inventario`, suma existencia y actualiza el costo unitario del insumo.
- Si hay caja abierta, el gasto queda ligado a esa caja y baja el efectivo esperado del corte.
- `Merma` descuenta inventario y deja movimiento con motivo, pero no afecta efectivo.
- `Inventario completo` compara conteo fisico contra cantidad esperada. Al aplicar el conteo, cada descuadro queda como movimiento de `conteo` con perdida o ganancia.
- Los insumos consumidos como extras se marcan como estimados porque dependen del gramaje configurado en el catalogo de extras.

## Restauracion

### Restaurar desde copia completa de `.librepos/`

1. Cierra LibrePOS en el equipo destino.
2. Copia la carpeta `.librepos/` respaldada dentro de la carpeta raiz de LibrePOS.
3. Abre LibrePOS.
4. Entra con un usuario existente y revisa ventas, usuarios, inventario y caja.

### Restaurar desde `Respaldo JSON`

El JSON exportado desde `Datos` contiene el estado compartido de la app, pero no es un importador grafico. Para una restauracion manual, un tecnico debe crear `.librepos/state.json` con esta forma:

```text
{
  "version": 1,
  "state": { ...contenido completo del respaldo JSON... }
}
```

Despues se arranca LibrePOS para que normalice el estado. Esta ruta no es ideal para restaurar usuarios porque el respaldo de interfaz no debe tratarse como copia completa de credenciales. Para recuperacion real usa copia completa de `.librepos/`.

## Actualizaciones

La app consulta GitHub:

```text
https://github.com/JMartinezRuiz/LIbepos
```

El actualizador toma los archivos de la raiz del repo en la rama `main`, conserva carpetas locales protegidas y ejecuta `npm install`.

Se conservan:

- `.git/`
- `.librepos/`
- `.vite/`
- `node_modules/`
- `dist/`
- `.DS_Store`
- `.env`
- `.env.local`

Para actualizar desde terminal:

```bash
npm run update
```

Despues de actualizar, cierra y vuelve a abrir LibrePOS.

## Seguridad

- Usa LibrePOS solo en una red WiFi de confianza.
- No publiques el puerto `5173` a internet.
- Cambia la contrasena inicial de `admin`.
- Usa usuarios individuales y permisos minimos.
- Guarda respaldos fuera del equipo servidor.
- Protege fisicamente el equipo servidor; quien accede a `.librepos/` puede acceder a datos operativos.

## Solucion de problemas

### `npm` no se reconoce

Instala Node.js LTS y vuelve a abrir el instalador.

### El telefono no abre LibrePOS

Verifica:

- El telefono esta en la misma red WiFi que el servidor.
- Estas usando la IP del servidor, no `localhost`.
- El firewall permite conexiones entrantes al puerto `5173`.
- La ventana del servidor sigue abierta.

### El puerto `5173` ya esta ocupado

Cierra ventanas anteriores de LibrePOS. Para una prueba temporal puedes arrancar en otro puerto:

```bash
npm start -- --port 5174
```

En ese caso tambien debes usar el nuevo puerto desde telefonos y tablets.

### No aparece el boton de actualizar

Solo lo ven administradores. Tambien puede ocultarse si GitHub no responde, si no hay internet o si ya estas en la version mas reciente.

### La actualizacion falla

Ejecuta:

```bash
npm run update
```

Revisa el mensaje de la consola, confirma que hay internet y vuelve a intentar. Si la app indica que ya escribio archivos nuevos pero fallo `npm install`, cierra LibrePOS y vuelve a abrirlo; el marcador de version se guarda antes de instalar dependencias para evitar que el boton de actualizar quede atorado.

En Windows, si el boton queda en `Actualizando` y no termina, cierra LibrePOS, abre PowerShell dentro de la carpeta `LibrePOS` y ejecuta el reparador publicado en GitHub:

```powershell
irm https://raw.githubusercontent.com/JMartinezRuiz/LIbepos/main/scripts/repair-update.ps1 | iex
```

El reparador descarga el ZIP del ultimo commit, conserva `.librepos/`, escribe el marcador local de version y vuelve a intentar `npm install`.

### El login falla despues de una restauracion manual

Si se restauro desde un JSON incompleto, pueden faltar datos de contrasenas. Restaura desde copia completa de `.librepos/` siempre que sea posible.
