# Quiniela 2026

Aplicación para administrar una quiniela del Mundial 2026: autenticación de usuarios, captura de predicciones, panel de administración, carga de resultados y exportación de predicciones a Excel.

## Stack

- `Next.js 16`
- `React 19`
- `Tailwind CSS 4`
- `Clerk` para autenticación
- `Convex` para base de datos, backend y tiempo real

## Servicios externos usados

### Clerk

Se usa para:

- inicio de sesión y registro
- gestión de sesión
- identidad del usuario

Variables relacionadas:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN`

### Convex

Se usa para:

- base de datos
- queries y mutations
- sincronización en tiempo real
- almacenamiento de archivos para exportaciones

Variables relacionadas:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL` opcional, puede ser generada por Convex aunque esta app no la usa directamente

## Setup para un fork

### 1. Clonar el proyecto

```powershell
git clone <tu-fork>
cd quiniela
npm install
```

### 2. Crear los servicios

Necesitas crear tus propias cuentas/proyectos en:

- [Clerk](https://clerk.com/)
- [Convex](https://convex.dev/)

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
CONVEX_DEPLOYMENT=dev:tu-deployment
NEXT_PUBLIC_CONVEX_URL=https://tu-deployment.convex.cloud

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_o_pk_live_xxx
CLERK_SECRET_KEY=sk_test_o_sk_live_xxx
CLERK_JWT_ISSUER_DOMAIN=https://tu-instancia.clerk.accounts.dev

# Opcional
NEXT_PUBLIC_CONVEX_SITE_URL=https://tu-deployment.convex.site
```

Notas:

- `CONVEX_DEPLOYMENT` y `NEXT_PUBLIC_CONVEX_URL` normalmente se obtienen al ejecutar `npx convex dev`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` salen desde el dashboard de Clerk.
- `CLERK_JWT_ISSUER_DOMAIN` debe coincidir con el dominio/issuer que Convex usa para validar los JWT de Clerk.
- No subas `.env.local` al repositorio.

### 4. Configurar Clerk con Convex

Este proyecto usa `ConvexProviderWithClerk` en el frontend y `CLERK_JWT_ISSUER_DOMAIN` en `convex/auth.config.ts` para autenticar requests hacia Convex.

Si vas a desplegar el fork:

- configura las mismas variables en tu hosting del frontend
- configura también `CLERK_JWT_ISSUER_DOMAIN` en el entorno de Convex

## Desarrollo local

Levanta Convex en una terminal:

```powershell
npx convex dev
```

En otra terminal inicia Next.js:

```powershell
npm run dev
```

La app quedará disponible en [http://localhost:3000](http://localhost:3000).

## Data inicial

La base de datos inicial del torneo vive en `convex/seedData.ts`.

Incluye:

- equipos
- grupos
- calendario inicial de partidos
- sedes y ciudades

La mutation que carga esta data es `matches:seed`, definida en `convex/matches.ts`.

Para poblar un deployment nuevo:

```powershell
npx convex run --push matches:seed
```

Qué hace el seed:

- elimina los registros existentes de `teams`
- elimina los registros existentes de `matches`
- vuelve a insertar la data inicial desde `convex/seedData.ts`

Importante:

- ejecuta este seed solo sobre una base nueva o controlada
- no está pensado para correrse después de que los usuarios ya hayan creado predicciones
- si modificas la data del torneo, actualiza `convex/seedData.ts` y vuelve a correr el seed con cuidado

## Flujo inicial recomendado para terceros

1. Crear el proyecto en Clerk.
2. Crear el proyecto en Convex.
3. Configurar `.env.local`.
4. Ejecutar `npx convex dev`.
5. Ejecutar `npx convex run --push matches:seed`.
6. Ejecutar `npm run dev`.
7. Iniciar sesión con tu usuario.
8. Entrar a `/admin/results`.
9. Si todavía no existe un administrador, usar el botón para convertirse en el primer admin.

## Primer administrador

Cuando un usuario inicia sesión por primera vez, la app lo sincroniza automáticamente en la tabla `users`.

Si todavía no existe ningún administrador, el primer usuario autenticado puede entrar a `/admin/results` y promoverse como administrador desde la interfaz.

## Scripts útiles

```powershell
npm run dev
npm run build
npm run lint
npx convex dev
npx convex run --push matches:seed
```
