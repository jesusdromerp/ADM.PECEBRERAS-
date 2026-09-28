# Resumen de cambios — Pesebreras Pro

Fecha: 28 de septiembre de 2026

Este documento resume la revisión completa del sistema y los cambios hechos en cinco etapas. El objetivo fue dejarlo listo como **prototipo funcional para una demostración en un solo equipo**.

**Estado final:** la compilación de producción (`next build`) y la verificación de tipos (`tsc`) pasan sin errores.

---

## Cómo correr la demo

```bash
npm install
npm run build
npm run start
```

Luego abre `http://localhost:3000`. En la pantalla de login hay botones de **ingreso rápido** para cada perfil: administrador, veterinario, mayordomo y propietario.

> Los datos se guardan en el navegador del equipo donde corre la demo. Usa siempre el mismo equipo y el mismo navegador.

---

## 1. Revisión inicial

Se revisó la aplicación completa en siete aspectos:

- arquitectura
- código muerto
- malas prácticas
- adaptación a móvil
- consistencia del diseño
- facilidad de uso
- errores de funcionamiento

Esa revisión sirvió de base para las etapas siguientes.

## 2. Limpieza de código muerto

- **Se eliminó el código sin uso:** componentes, funciones y tipos que nada utilizaba.
- **Se retiraron los restos de Supabase:** `isSupabaseConfigured` e `isLocalMode`.
- **Se renombró el aviso de datos:** `SupabaseSyncBanner` pasó a llamarse `LocalDataBanner`. Ahora dice la verdad: "Datos guardados solo en este navegador".
- **Se unificaron las utilidades repetidas en `lib/`:**

| Archivo | Para qué sirve |
|---|---|
| `lib/ids.ts` | Crear identificadores únicos |
| `lib/dates.ts` | Fechas en hora local y cálculo de edad |
| `lib/whatsapp.ts` | Normalizar teléfonos y armar enlaces de WhatsApp |
| `lib/plan-coverage.ts` | Saber si un servicio lo cubre el plan del cliente |
| `lib/theme.ts` | Tema claro u oscuro sin parpadeo |
| `lib/image.ts` | Comprimir fotos antes de guardarlas |

- **Hooks nuevos:**
  - `useCurrentUser`: usuario actual.
  - `useDialog`: comportamiento común de las ventanas emergentes.
- **Componente nuevo:** `ConfirmDialog`, para las confirmaciones.

## 3. Correcciones de lógica de negocio

### Fechas
- Todas las fechas usan la hora local de Colombia, no UTC. Antes algunas quedaban un día corridas.
- La edad del caballo se calcula desde su fecha de nacimiento, en lugar de guardarse como un número fijo.

### Clientes
- El saldo pendiente, la cantidad de caballos y el estado "en mora" se calculan solos a partir de los recibos.
- Ya no se editan a mano, así que no pueden quedar desactualizados.
- Un cliente está en mora si tiene algún recibo vencido.

### Facturación
- Cada vez que se abre la app pasa lo siguiente:
  - los recibos atrasados se marcan como vencidos
  - se genera el canon del mes actual
- Los recibos tienen numeración única y consecutiva: `REC-AAAA-NNNN`.
- Se puede **deshacer un pago** registrado por error.
- Al confirmar un pago se elige el método: efectivo, transferencia, etc.
- Los ingresos del mes cuentan solo lo pagado en el mes actual.

### Veterinaria
- Cada cobro al propietario queda enlazado con su tratamiento.
- Si se edita el tratamiento, el cobro se ajusta.
- Si se borra el tratamiento, se borran también su entrada en el historial clínico y los cobros pendientes que generó.
- Qué se cobra y qué no depende de lo que incluye el plan del cliente, no del código del plan.

### Inventario
- Se reescribió con un **historial de movimientos**: entradas, salidas y el motivo de cada una.

### Caballos
- Dar de baja un caballo lo **retira sin borrarlo**. Hay una lista de caballos retirados.
- Al retirar un caballo se muestra lo que debe.

### Pesebreras
- Asignar un caballo a un box, registrar mantenimiento y liberar un box vacío. Cada acción pide confirmación.

### Incidentes
- El montador reporta incidentes y puede avisar al propietario.
- Los incidentes se marcan como atendidos.

### Almacenamiento
- Las fotos se comprimen antes de guardarse: de 3–6 MB quedan en unos 150 KB.
- Si el navegador se queda sin espacio, la app muestra un aviso en lugar de fallar en silencio.

## 4. Adaptación a móvil, diseño y facilidad de uso

- **El problema más grave era el encabezado.** Se salía de la pantalla y Chrome en el celular mostraba toda la app reducida. Ya está corregido.
- **Ventanas emergentes.** Todas funcionan igual:
  - se cierran con Escape, y solo la de encima
  - no dejan que el foco se escape
  - bloquean el scroll del fondo
  - devuelven el foco al cerrarse
- **Confirmaciones.** Hay un diálogo común antes de pagar, borrar o liberar.
- **Tema claro/oscuro.** Ya no parpadea al cargar la página.
- **Carga de la página.** Se quitaron los errores de "hidratación" de React. Mientras carga se muestra un esqueleto.
- **Barra de módulos.** Arrastrarla ya no activa un módulo sin querer.
- **Celular.** Los botones ya no se aplastan.
- **WhatsApp.** Los enlaces funcionan aunque el cliente no tenga número registrado.
- **Textos.** Son más claros y no prometen funciones que no existen, como la sincronización en la nube.

## 5. Preparación para la demo

### Acceso y sesión
- Sin sesión, cualquier ruta protegida lleva al login.
- Tras iniciar sesión, cada perfil llega a **su propio portal**, aunque viniera de otra ruta.
- Si la sesión ya estaba abierta, el login lleva directo al portal.

### Permisos por perfil
- Solo el **administrador** y el **mayordomo** registran caballos.
- El **administrador** y el **veterinario** pueden eliminar tratamientos.
- Cada perfil ve solo las secciones que le corresponden.
- Las barras de administración (buscador, aviso de datos, selector de rol) solo las ve el administrador.

### Portal del propietario
- Las fichas de sus caballos son de **solo lectura**.
- Tiene el botón **"Marcar como leídas"** para las notificaciones.
- Tiene contacto directo por WhatsApp.

### Palafrenero
- Su registro diario se guarda como borrador si no lo termina.

### Pruebas hechas en el navegador
Todos estos flujos funcionaron:
- nuevo cobro, pagar y deshacer el pago
- asignar un caballo a un box y registrar mantenimiento
- reportar un incidente y marcarlo como atendido
- eliminar un tratamiento veterinario
- crear y guardar un plan de canon
- movimientos de inventario
- entrar con cada perfil y llegar a su portal
- vista en celular

---

## Limitaciones conocidas (es un prototipo, no un producto final)

1. **No hay servidor ni base de datos.** Todo se guarda en el navegador de un solo equipo. Dos personas en equipos distintos no ven los mismos datos. Para ponerlo en producción hace falta un backend con base de datos compartida.
2. **Las contraseñas no están cifradas y aparecen en la pantalla de login.** Es a propósito, para facilitar la demo. No sirve para uso real.
3. **Los cánones de meses pasados no se generan.** Si la app no se abre durante un mes entero, el canon de ese mes no se crea.
4. **Algunos componentes siguen siendo muy grandes**, como el panel principal y varias vistas. Conviene dividirlos más adelante.
5. **El revisor de código (lint) aún marca 19 errores y 105 advertencias.** Son heredados de antes y casi todos de estilo; al comienzo eran 152 y 23.
