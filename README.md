# LibrePOS

LibrePOS es un punto de venta local para restaurante. Incluye venta por mesas y para llevar, comandas digitales, cocina, caja, inventario, catalogo, usuarios, fichaje, exportacion de datos y sincronizacion por red WiFi.

## Documentacion

- [Guia de usuario](docs/USUARIO.md): flujo diario para meseros, cocina, caja y administradores.
- [Administracion y mantenimiento](docs/ADMINISTRACION.md): instalacion, datos locales, respaldos, restauracion, actualizaciones y seguridad.
- [Desarrollo](docs/DESARROLLO.md): estructura del proyecto, comandos, arquitectura y checklist de release.
- [API local](docs/API_LOCAL.md): endpoints internos usados por la app para sincronizacion, login y actualizaciones.

## Inicio rapido

### macOS

1. Abre `Instalar LibrePOS.command`.
2. Cuando termine, abre `Abrir LibrePOS.command`.
3. El navegador abrira `http://localhost:5173/`.

### Windows

1. Abre `Instalar LibrePOS.bat`.
2. Cuando termine, abre `Abrir LibrePOS.bat`.
3. El navegador abrira `http://localhost:5173/`.

Los archivos `.bat` de Windows no dependen de Python. Funcionan con Node.js/npm directamente, asi que no importa si tienes Python 3.14.4 u otra version instalada.

## Login inicial

```text
Usuario: admin
Contrasena: admin
```

Cambia la contrasena desde `Usuarios` antes de usar LibrePOS en operacion real.

## Acceso desde telefono o tablet

El equipo que corre LibrePOS actua como servidor local. En otros dispositivos de la misma red WiFi no uses `localhost`; usa la IP que muestra la ventana al arrancar, por ejemplo:

```text
http://192.168.1.73:5173/
```

La red debe permitir conexiones al puerto `5173` del equipo servidor.

## Instalacion manual

Si prefieres terminal:

```bash
npm install
npm run build
npm start
```

Comandos disponibles:

```bash
npm start      # servidor local Vite en 0.0.0.0:5173
npm run build  # compilacion de produccion en dist/
npm run preview
npm run update # actualizacion desde GitHub
```

## Datos locales

Los datos reales del restaurante se guardan localmente en:

```text
.librepos/state.json
```

La carpeta `.librepos/` esta ignorada por Git para no publicar ventas, usuarios, tokens ni informacion de operacion. Para migrar el POS a otro equipo y conservar datos completos, copia la carpeta `.librepos/` con el servidor detenido.

## Actualizaciones

LibrePOS consulta `https://github.com/JMartinezRuiz/LIbepos` y muestra el boton `Actualizar` solo a usuarios admin cuando hay cambios nuevos en la rama `main`.

Al actualizar se descargan los archivos del proyecto, se ejecuta `npm install` y se conserva completa la carpeta `.librepos/`, por lo que ventas, mesas, usuarios, inventario, fichajes y datos locales no se borran. Tras actualizar, cierra y vuelve a abrir LibrePOS para cargar tambien los cambios del servidor local.

La version visible en la pantalla sale de `package.json` y se muestra como `vX.Y.Z`. Cada update publicado debe aumentar el campo `version` en `package.json` y `package-lock.json` antes de subirlo a GitHub.

## Seguridad local

LibrePOS esta pensado para uso local en una red WiFi de confianza. No lo expongas a internet publico. Protege el equipo servidor, cambia la contrasena inicial de `admin` y guarda los respaldos fuera del equipo donde corre el POS.
