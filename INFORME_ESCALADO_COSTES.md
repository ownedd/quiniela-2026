# Informe de escalado y costes

## Contexto

La app nació como una quiniela pequeña para un entorno familiar, usando:

- `Vercel` para despliegue
- `Clerk` para autenticación
- `Convex` como backend y base de datos

Ahora aparece una nueva oportunidad: mantener una **versión interna** para empleados de una empresa y una **versión pública** para sus clientes.

Importante: esto **no implica un modo enterprise** ni requisitos típicos de autenticación corporativa como `SSO`, `SAML`, `SCIM` o auditoría avanzada. El cambio principal es de **volumen de usuarios** y de **alcance del producto**, no de complejidad enterprise.

> **Nota (empresa con ~30k–100k clientes):** el impacto real depende de cuántos de esos clientes **entran cada mes** y de cuántas **consultas/actualizaciones** genera la app por usuario. Tener 80k registrados con pocos activos no es lo mismo que 80k que abren la quiniela cada jornada.

## Conclusión general

Con el escenario actual, **no parece necesario migrar de inmediato** fuera de `Clerk` o `Convex`.

La recomendación base es:

- pasar `Vercel` a `Pro`
- mantener `Clerk` por simplicidad
- mantener `Convex` mientras siga dando buena velocidad de desarrollo y costes razonables

La migración a otras alternativas solo tendría sentido si el uso real confirma que el coste o el lock-in empiezan a ser un problema.

> **Nota (30k–100k clientes):** a ese volumen **ya no es razonable quedarse solo en “lanzar y ver”**: conviene presupuestar `Vercel Pro`, plan de pago en `Convex` si superas el free, y revisar si `Clerk` sigue dentro del tramo gratuito o incluido en `Pro` según **MRU** (usuarios retenidos al mes, definición de Clerk). Si muchos clientes juegan cada semana, es probable que **auth y backend** dejen de ser “casi gratis”.

## Análisis por servicio

> **Nota (30k–100k clientes):** a este tamaño, los tres servicios dejan de comportarse como “capa gratuita de hobby”: el coste suele repartirse entre **tráfico y cómputo en Vercel**, **MRU y plan en Clerk**, y **llamadas + ancho de banda de datos en Convex**. Lo crítico es distinguir **cuentas creadas** vs **usuarios que vuelven cada mes**.

### Vercel

`Vercel Hobby` deja de ser una opción razonable cuando la app pasa a tener uso empresarial real, aunque sea en un caso simple como empleados + clientes.

Conclusión:

- el salto natural es `Vercel Pro`
- el coste base actual es asumible para una app en crecimiento
- el principal riesgo de coste está en el consumo variable si la app usa mucho `SSR`, funciones o tráfico dinámico

Recomendación:

- usar `Vercel Pro` desde el momento en que la app se publique para este nuevo contexto

> **Nota (30k–100k clientes):** el coste suele crecer por **transferencia de datos** (assets, páginas dinámicas), **invocaciones** de funciones y picos en días de partido. Con decenas de miles de usuarios concurrentes en jornadas clave, puede hacer falta **optimizar caché, estáticos y menos SSR**; el variable de `Vercel` puede superar con creces el precio fijo del plan.

### Clerk

Con esta nueva aclaración, `Clerk` encaja mejor de lo que parecía inicialmente.

No necesitas capacidades enterprise avanzadas; solo necesitas una autenticación sólida, rápida de implementar y fácil de mantener para dos audiencias:

- empleados
- clientes

Ventajas de seguir con `Clerk`:

- reduce mucho el trabajo de implementación
- evita tener que construir o mantener flujos sensibles de auth
- resuelve bien sesiones, login, recuperación y seguridad básica

Conclusión:

- **no hay una necesidad fuerte de migrar a `Better Auth` ahora mismo**
- `Clerk` sigue siendo una opción razonable mientras el volumen real de usuarios activos no dispare el coste

Solo tendría sentido plantear una migración si ocurre alguno de estos casos:

- el número de usuarios activos mensuales crece mucho
- el coste por usuario deja de compensar
- se quiere reducir dependencia de proveedor
- se quiere mover la autenticación a una base de datos propia

> **Nota (30k–100k clientes):** Clerk cobra por **usuarios retenidos mensuales (MRU)** por app, no por “tener 100k cuentas creadas”. Si en la práctica **más de ~50k** encajan en la definición de MRU de Clerk en un mes, entras en **sobrecoste** (tramos con precio por usuario adicional). En ese rango también es más probable que quieras **quitar branding, MFA o sesiones largas**, lo que empuja a **plan Pro** de Clerk aunque el volumen siga manejable.

### Convex

`Convex` es probablemente el punto que más hay que vigilar al crecer.

En una quiniela con empleados y clientes puede haber:

- muchas lecturas de jornadas, partidos y clasificaciones
- actualizaciones frecuentes
- componentes reactivos
- consultas repetidas por muchos usuarios al mismo tiempo

Eso hace que el consumo de backend pueda crecer antes que el coste de autenticación.

Conclusión:

- el mayor riesgo de coste a medio plazo probablemente esté más en `Convex` que en `Clerk`
- no hace falta migrar ahora, pero sí conviene medir uso real desde el principio

> **Nota (30k–100k clientes):** aquí suele ser el **cuello de botella principal**. El plan gratuito de `Convex` incluye un tope de **llamadas a funciones/mes** y **ancho de banda de base de datos** relativamente bajo; con muchos clientes suscritos a datos en vivo o refrescando marcadores y clasificaciones, es fácil **superar el free** y pasar a **Professional** (coste por desarrollador + posibles excesos). Conviene diseñar **menos lecturas redundantes**, paginación y agregados para no multiplicar llamadas.

## Sobre Better Auth

`Better Auth` sigue siendo una alternativa interesante, pero **no es una migración necesaria por el mero hecho de que la app pase a usarse en una empresa**.

En este caso tendría sentido principalmente por:

- control total sobre la autenticación
- reducción de lock-in
- evitar pricing por usuario
- preparar una arquitectura más estándar con `Postgres`

No tendría tanto sentido si la motivación es solo "ahora lo usará una empresa", porque tu caso no es de autenticación enterprise compleja, sino de producto con más usuarios.

> **Nota (30k–100k clientes):** si `Clerk` empieza a facturar fuerte por MRU, **Better Auth** (u otra auth en tu propia DB) puede compensar a cambio de **más trabajo de ingeniería y operación**. Si mantienes `Convex`, existe integración con Better Auth vía componente oficial; si además migras datos a **Postgres**, el ahorro en auth suele ir acompañado de un **proyecto de migración** más grande.

## Recomendación práctica

### Corto plazo

Mantener el stack actual con un único ajuste claro:

- `Vercel Pro`
- `Clerk`
- `Convex`

> **Nota (30k–100k clientes):** el “corto plazo” sigue siendo válido para **arrancar**, pero debes asumir que **probablemente** necesitarás `Convex` de pago y vigilancia fuerte de uso; en `Clerk`, validar si el volumen de MRU se mantiene bajo el umbral gratuito o incluido antes de que el coste mensual se dispare.

### Qué medir tras lanzar la nueva etapa

Antes de plantear migraciones, conviene medir durante las primeras semanas:

- usuarios activos mensuales reales
- consumo de funciones y ancho de banda en `Convex`
- tráfico y uso dinámico en `Vercel`
- coste mensual consolidado del stack

> **Nota (30k–100k clientes):** con ese tamaño, la medición deja de ser “unas semanas de curiosidad” y pasa a ser **dashboard + alertas**: MRU en Clerk, function calls y DB bandwidth en Convex, y transferencia/invocaciones en Vercel. Sin eso, el primer pico (final de liga, promos, etc.) puede llegar como **sorpresa en factura**.

### Cuándo replantear arquitectura

Revisar una migración a `Better Auth` o a una base de datos más estándar si aparece alguno de estos síntomas:

- el coste de `Clerk` crece demasiado por volumen
- `Convex` empieza a ser caro por consultas o reactividad
- se necesita más control sobre los datos y la autenticación
- se quiere preparar el producto para crecer con menos dependencia de servicios gestionados

> **Nota (30k–100k clientes):** en este tramo es **normal** que aparezcan ya varios de esos síntomas a la vez (sobre todo Convex + posible sobrecoste Clerk). La decisión deja de ser “si migrar” y pasa a ser **cuándo** y **qué trozo migrar primero** (auth vs backend vs hosting).

## Decisión recomendada hoy

Si el objetivo es sacar una versión interna para empleados y una pública para clientes sin complicar de más la arquitectura:

- **mantener `Clerk`**
- **mantener `Convex`**
- **subir `Vercel` a `Pro`**
- **medir el uso real antes de migrar**

> **Nota (30k–100k clientes):** si el negocio confirma que el público va hacia ese orden de magnitud, esta decisión sigue siendo buena **como punto de partida**, pero deberías **planificar** en paralelo límites de gasto, optimización de consultas en Convex y revisión del modelo de facturación de Clerk por MRU; si no, puedes llegar a ese volumen con una arquitectura que **funciona pero ya no es barata**.

## Resumen final

La app no ha pasado a un escenario enterprise; ha pasado a un escenario de **más alcance y más usuarios**.

Por eso:

- `Vercel Pro` sí parece necesario
- migrar la autenticación a `Better Auth` no parece urgente
- el punto a vigilar de verdad es el consumo de `Convex`

La mejor decisión ahora mismo es **conservar la simplicidad del stack actual**, lanzar, medir y solo entonces decidir si merece la pena una migración arquitectónica.

> **Nota (30k–100k clientes):** el resumen sigue siendo “vigilar Convex y medir”, pero a esa escala lo normal es que **el coste variable** (Convex + tráfico Vercel + posible MRU en Clerk) ya sea una **partida recurrente** del producto, no un detalle. Si el roadmap apunta a cientos de miles, conviene decidir antes **límites técnicos** (caché, menos realtime global, agregados) para no depender solo de subir de plan.
