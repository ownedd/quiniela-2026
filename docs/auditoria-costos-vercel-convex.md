# Auditoría de Costos Vercel y Convex

Documento de referencia para consultar **antes de lanzar** y **cuando crezca el tráfico**.

---

## Diagnóstico

El consumo actual de Vercel y Convex es bajo. Con un escenario de 10-15 usuarios simultáneos, el riesgo inmediato sigue siendo bajo; las mejoras son preventivas y apuntan a evitar trabajo innecesario.

### Hallazgos principales

- **Middleware** con Clerk en `src/middleware.ts` ejecuta matching amplio y es candidato a costo en Edge.
- **Imágenes remotas** de avatar pasan por `next/image`; las banderas ya usan `unoptimized`.
- No hay `route.ts`, `pages/api`, SSR/ISR explícito ni handlers propios de Next; el costo de Vercel viene más por middleware, imágenes y transferencia.
- **Convex**: `matches.byGroup` hacía scans completos y lecturas N+1; `scoring` recalculaba toda la tabla al cargar un resultado.
- Queries reactivas repetidas en layout y navegación (`isAdmin`, `tournamentSettings.get`).

---

## Hacer Ahora (implementado)

- [x] Optimizar `matches.byGroup` en `convex/matches.ts`: índice `by_group` + pre-carga de equipos en Map.
- [x] Recálculo incremental en `convex/scoring.ts`: `updateScoresForMatch` solo actualiza usuarios que predijeron el partido.
- [x] Reducir queries duplicadas: `LayoutContext` con `isAdmin` y `predictionsLocked`; `BottomNav` consume el contexto.

---

## Antes de Lanzar (implementado)

- [x] Reducir alcance del `matcher` en `src/middleware.ts` a `["/predictions(.*)", "/admin(.*)"]`.
- [x] `SyncUser` ya optimizado: la mutación `users.store` solo escribe cuando hay cambios.
- [x] PWA y banderas sin cambios salvo que aparezca presión por bandwidth.

---

## Solo Si Crece el Tráfico

- [x] Avatares remotos: añadido `unoptimized` en `src/app/page.tsx` y `src/app/predictions/page.tsx`.
- [ ] Medir de nuevo Vercel cuando haya uso real para decidir si `middleware` o `Image Optimization` necesitan más cambios.
- [ ] Medir de nuevo Convex cuando suban usuarios concurrentes para validar si el cuello real está en consultas reactivas o en mutaciones administrativas.

---

## Criterios de Éxito

- Menos lecturas y recomputaciones completas en Convex por pantalla y por cambio de resultado.
- Menos ejecuciones de `middleware` por request protegido, sin romper autenticación.
- Mantener bajo el uso de `Image Optimization` en Vercel.
- Mantener el comportamiento actual de auth, ranking y predicciones sin regresiones.

---

## Archivos Modificados (referencia)

| Archivo | Cambio |
|---------|--------|
| `convex/schema.ts` | Índice `by_matchId` en `predictions` |
| `convex/matches.ts` | `byGroup` con índice + Map de equipos; `list` con Promise.all; `setResult` usa `updateScoresForMatch` |
| `convex/scoring.ts` | Nueva función `updateScoresForMatch` para actualización incremental |
| `src/components/LayoutClient.tsx` | `LayoutContext` con `isAdmin` y `predictionsLocked` |
| `src/components/BottomNav.tsx` | Usa `useLayoutContext()` en lugar de `useQuery(api.users.isAdmin)` |
| `src/middleware.ts` | Matcher restringido a `/predictions` y `/admin` |
| `src/app/page.tsx` | Avatares con `unoptimized` |
| `src/app/predictions/page.tsx` | Avatares con `unoptimized` |
