# Guia de usuario

Esta guia cubre el uso diario de LibrePOS en restaurante. La app corre en un equipo servidor y otros telefonos, tablets o computadoras entran por la misma red WiFi.

## Roles y permisos

- Todos los usuarios: `Mi perfil`, fichaje y vista personal.
- Mesero: venta, mesas y ordenes para llevar.
- Cocina: tablero de comandas y cambios de estado.
- Caja: apertura, cobro, gastos y cierre de caja.
- Administrador: inventario, catalogo, datos, usuarios y actualizaciones.

Un usuario puede tener varias funciones al mismo tiempo.

## Primer acceso

```text
Usuario: admin
Contrasena: admin
```

En operacion real, entra como admin y cambia esta contrasena desde `Usuarios`. Despues crea usuarios por persona y asigna solo las funciones que necesiten.

## Arranque diario

1. En el equipo servidor abre `Abrir LibrePOS.command` en macOS o `Abrir LibrePOS.bat` en Windows.
2. Deja abierta la ventana del servidor mientras se usa LibrePOS.
3. Entra en el navegador con `http://localhost:5173/` desde el servidor.
4. En telefonos o tablets usa la URL WiFi que aparece en la ventana, por ejemplo `http://192.168.1.73:5173/`.
5. Inicia sesion con tu usuario.
6. Abre caja antes de vender. Mientras la caja este cerrada, la app bloquea nuevas mesas, ordenes para llevar y cobros.

## Venta por mesa

1. En `Venta` o `Mesas`, toca `Nueva mesa`.
2. Selecciona numero de mesa, comensales y mesero responsable.
3. Agrega productos al ticket.
4. Configura variantes, extras, notas o partes mixtas cuando el producto lo permita.
5. Usa `Comandar` para mandar los productos pendientes a cocina o barra.
6. Cuando el cliente pida la cuenta, usa `Precio` para revisar el total.
7. Confirma el cobro para cerrar la orden y generar la venta.

Los productos ya comandados no deben modificarse como si fueran nuevos. Si necesitas retirar algo, usa la accion de cancelacion disponible en el ticket para que quede registro.

## Venta para llevar

1. En `Venta`, toca `Para llevar`.
2. Captura el nombre o nota del pedido cuando aplique.
3. Agrega productos y comandas igual que en mesa.
4. Cobra desde el ticket cuando el pedido este listo o pagado.

## Cocina

La vista `Cocina` agrupa comandas por estado. El personal de cocina puede avanzar cada partida segun el flujo operativo:

- Nuevo o pendiente: producto recibido por cocina/barra.
- En preparacion: producto tomado por la estacion.
- Listo: producto terminado y listo para entregar.

Las comandas se sincronizan entre dispositivos conectados al mismo servidor local.

## Caja

La caja controla la jornada de cobro.

1. Abre caja con fondo inicial.
2. Registra ventas desde los tickets.
3. Captura gastos operativos cuando correspondan.
4. Al final del turno, cuenta efectivo y cierra caja.
5. Revisa diferencia, ventas en efectivo, ventas con tarjeta, propinas y notas del cierre.

Si una venta tiene pago en efectivo, LibrePOS calcula efectivo a recibir, recibido y cambio.

## Inventario

La vista `Inventario` es para administradores.

- Revisa insumos, unidades, proveedores, costos y cantidad disponible.
- Usa `Subir ticket` para registrar compras de insumos: captura insumo, cantidad y coste del ticket. LibrePOS suma inventario, actualiza el costo unitario y descuenta el importe del efectivo esperado si hay caja abierta.
- Usa `Merma` para descontar insumos por caducidad, rotura, preparacion fallida u otro motivo operativo.
- Usa `Inventario completo` para comparar lo que debe haber contra el conteo fisico. La diferencia se calcula como perdida o ganancia y se puede aplicar como ajuste de inventario.
- Las recetas pueden descontar insumos estimados cuando se venden productos configurados.
- Los insumos usados por extras muestran aviso porque el gramaje de extra es estimado.
- La accion `Inventario a cero` es destructiva para cantidades; usala solo cuando sea intencional.

## Catalogo y recetas

La vista `Catalogo` permite administrar productos, extras e ingredientes.

- Productos: nombre, seccion, subseccion, precio, estacion, estado activo y receta por unidad.
- Extras: nombre del extra, precio de venta, insumo de inventario vinculado y gramaje/cantidad estimada que se descuenta al venderlo.
- Insumos: categoria, proveedor, unidad, costo unitario, cantidad y elegibilidad para receta.
- Productos inactivos se conservan para historial, pero no aparecen como vendibles.
- Extras inactivos se conservan para historial, pero ya no aparecen en venta.

## Datos y exportaciones

La vista `Datos` concentra ventas, cortes, gastos e inventario. Los administradores pueden exportar:

- `Ventas CSV`
- `Cortes CSV`
- `Gastos CSV`
- `Inventario CSV`
- `Respaldo JSON`

Los CSV sirven para revision en Excel. El respaldo JSON contiene el estado compartido de operacion y se debe guardar fuera del equipo servidor.

## Impresora

La vista `Impresora` aparece solo para administradores. Permite seleccionar una impresora instalada en el equipo servidor y enviar un ticket de prueba con el texto `test`.

Si la impresora no aparece en la lista, captura su nombre exacto en `Nombre manual` y pulsa `Seleccionar impresora`. Las impresoras Bluetooth deben estar vinculadas e instaladas en el sistema operativo del laptop para aparecer automaticamente.

## Usuarios

Desde `Usuarios`, el admin puede crear, activar o desactivar usuarios, cambiar contrasenas y asignar funciones.

Recomendaciones:

- No compartas el usuario `admin`.
- Usa un usuario por persona.
- Desactiva usuarios que ya no trabajen en el restaurante.
- Cambia contrasenas cuando un dispositivo se pierda o deje de ser confiable.

## Actualizaciones

Cuando hay una version nueva, los administradores ven el boton `Actualizar`. Despues de aplicar una actualizacion:

1. Espera a que termine.
2. Cierra la ventana del servidor.
3. Vuelve a abrir LibrePOS.
4. Verifica que la version visible haya cambiado.

Las actualizaciones conservan `.librepos/`, donde viven ventas, usuarios, inventario y configuracion local.

## Buenas practicas

- Haz un respaldo JSON al cerrar cada jornada.
- Haz copia completa de `.librepos/` antes de actualizaciones importantes o cambios de equipo.
- Manten el equipo servidor conectado a corriente y en una red WiFi estable.
- No uses LibrePOS desde redes publicas ni lo abras hacia internet.
