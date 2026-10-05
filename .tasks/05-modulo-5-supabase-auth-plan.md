# Módulo 5 — Login real con Supabase Auth

> El usuario lo pidió como opción (a) de seguimiento tras la capa de datos:
> "conectar el login real de Supabase Auth". En nuestra secuencia de ramas es el
> quinto bloque de trabajo. El fichero se numera `05-`.

## Objetivo
Reemplazar el stub de submit del módulo de autenticación (`useAuthSubmit.ts`,
que hoy guarda un token placeholder `session-<Date.now()>`) por llamadas reales
a Supabase Auth: iniciar sesión (`signInWithPassword`) y registro (`signUp`).
Al autenticarse, la sesión/usuario real queda disponible mediante un hook de
sesión, de modo que los hooks de datos `useMacroGoal` / `useSaveMacroGoal`
reciban un `userId` real en lugar de `null`.

## Superficie de trabajo (sin ambigüedad)
Todo vive en `apps/macros-web` (app web DOM, Vite + React + TS + Tailwind) donde
`@supabase/supabase-js` y `@tanstack/react-query` ya funcionan. NO se toca la app
Expo raíz.

## Rama propuesta
- **Nueva rama:** `feat/modulo-5-supabase-auth`
- **Basada en:** `feat/modulo-4-supabase-data` (tip del stack: contiene el
  scaffold de macros-web, el módulo de auth, el cliente de Supabase y los hooks
  de macro-goal). Es un **PR apilado** cuya base de PR es
  `feat/modulo-4-supabase-data`.
- **Orden natural de merge:** #1 → #2 → #3 (auth) → #4 (data) → este.

## Decisión de arquitectura: persistencia de sesión vs. TokenStorage
`@supabase/supabase-js` gestiona su PROPIA persistencia de sesión (por defecto
en `localStorage` en web, con refresh automático del token). Mantener además el
`TokenStorage` manual guardando el JWT provocaría **doble almacenamiento** del
token y dos fuentes de verdad.

**Decisión:** dejar que supabase-js sea el ÚNICO dueño de la persistencia de la
sesión. Se **retira** el placeholder `session-<Date.now()>` del flujo de submit
(ya no se guarda ningún token manual al iniciar sesión). El `TokenStorage`
(web localStorage + native expo-secure-store) **no se borra**: queda como una
utilidad de almacenamiento seguro, agnóstica de plataforma, disponible para
usos futuros (p. ej. preferencias no sensibles o un backend propio), pero deja
de usarse para el JWT de Supabase. Así evitamos el doble almacenamiento y no
dejamos un placeholder haciéndose pasar por un token real.

**Seguridad:** se mantiene y respeta el trade-off ya documentado de
`localStorage` en web (vulnerable a XSS); supabase-js usa ese mismo mecanismo en
web, de modo que no introducimos un riesgo nuevo ni lo debilitamos. No se guarda
el token por duplicado. La contraseña nunca se registra (se mantiene
`redactCredentials`). La autorización real vive en RLS (`auth.uid()`), no en el
cliente.

## Qué se construye
1. **Módulo de datos de Auth** (`src/features/auth/auth.data.ts`): funciones
   puras async que reciben el cliente inyectable y mapean `AuthError` de
   Supabase a `Error` claros y no filtrantes (mismo patrón `toClearError` de
   `macroGoals.data.ts`: el error crudo va en `cause`, nunca en `message`):
   - `signInWithPassword(client, { email, password })`
   - `signUpWithPassword(client, { email, password })`
   - `signOut(client)`
   - `getCurrentSession(client)` / `getCurrentUser(client)`
2. **Hook/Provider de sesión** (`src/features/auth/useSession.ts` +
   `src/app/SessionProvider.tsx`): expone `{ userId, session, user, status }`
   leyendo `supabase.auth.getSession()` al montar y suscribiéndose a
   `onAuthStateChange` (con `unsubscribe` en el cleanup). La suscripción a
   cambios de auth es un `useEffect` legítimo (no es fetching de datos). Se monta
   junto al `QueryClientProvider` en `src/main.tsx`.
3. **Cableado de los formularios**: `LoginForm`/`RegisterForm` pasan un
   `onSubmit` real (vía un pequeño hook/handler que usa `auth.data`) a
   `useAuthSubmit`. Se reescribe `defaultSubmit` de `useAuthSubmit` para que ya
   NO guarde el placeholder; el submit real se inyecta. Se mantiene el logging
   redactado y la semántica de `submitError` (mensajes amables y no filtrantes:
   credenciales inválidas, correo ya registrado, etc.).
4. **userId real a los hooks de datos**: `App.tsx` lee `userId` desde
   `useSession()` y lo pasa a `useMacroGoal(userId)` / `useSaveMacroGoal(userId)`
   (hoy reciben `null`). Se añade un afford de cerrar sesión (`signOut`) si es
   trivial, reutilizando los primitivos de UI existentes (FormCard, Button).

## Reglas duras (steering)
- TypeScript estricto; **prohibido `any`**. Se usan los tipos del SDK
  (`Session`, `User`, `AuthError`, `AuthResponse`).
- **Seguridad:** sin secretos hardcodeados (solo envs `VITE_` + anon key ya
  configurados). Nunca registrar la contraseña (se mantiene `redactCredentials`).
  Mapeo de errores no filtrante. Se respeta el trade-off documentado de
  `localStorage`. Sin lógica de autorización en el cliente que corresponda a RLS.
- **Sin `console.log`** (ESLint `no-console`): si hace falta observar, se usa el
  logger inyectable existente.
- Inmutabilidad; muchos archivos pequeños (200–400 líneas típico, 800 máx.);
  funciones < 50 líneas; manejo de errores amable y completo.
- Reutilizar los tokens de diseño Enchanted/Cozy y los primitivos de auth
  (FormCard, Button, AuthField). No introducir colores nuevos.

## Testing (cobertura mínima 80%; unit + integración; TDD donde sea práctico)
- **auth.data**: unit con `supabase.auth` mockeado — éxito + mapeo de
  `AuthError` + aserciones de no-filtración (espejo de `macroGoals.data.test.ts`).
- **useSession**: `getSession` inicial, reacciona a `onAuthStateChange`, hace
  `unsubscribe` al desmontar (cliente mockeado, `renderHook`).
- **Integración**: enviar `LoginForm`/`RegisterForm` invoca el camino real
  (mockeado) y un login exitoso expone un `userId` que habilita `useMacroGoal`.
- Se **actualizan** (no se borran) las aserciones existentes de
  `LoginForm`/`RegisterForm` que verificaban el placeholder `session-<n>`, ya que
  ese comportamiento del stub es justo lo que se reemplaza.
- E2E (Playwright) solo si es viable sin Supabase vivo; si no, se mockea o se
  documenta.

## Nota de entorno
No hay proyecto Supabase vivo en el sandbox, así que no se puede autenticar de
verdad contra el backend. El código queda correcto y auto-consistente y las
pruebas usan un cliente mockeado; nunca se borran pruebas para forzar verde.
Para el run completo verde se materializa temporalmente
`src/features/energy/domain` desde `main` (sin commitearlo) para resolver el
alias `@energy` de las suites preexistentes del wizard, y se elimina antes de
terminar. Las suites nuevas de auth son auto-contenidas (sin dependencia de
`@energy`).

## Verificación
Desde `apps/macros-web`: `npm run typecheck`, `npm run lint`,
`npm run test:coverage` (cobertura 80%+), `npm run build`.

## Features (ordenadas; dependencias primero)
1. **FEAT-001 (feat)** — Módulo de datos de Auth (`auth.data.ts`) + tests
   unitarios con `supabase.auth` mockeado (éxito + mapeo no-filtrante de
   `AuthError`).
2. **FEAT-002 (feat)** — Hook/Provider de sesión (`useSession.ts` +
   `SessionProvider.tsx`), montaje en `main.tsx`, y tests del hook
   (getSession inicial, onAuthStateChange, unsubscribe).
3. **FEAT-003 (feat)** — Cableado real de `LoginForm`/`RegisterForm` vía
   `useAuthSubmit` (retirar placeholder), afford de sign-out, paso del `userId`
   real a `useMacroGoal`/`useSaveMacroGoal` en `App.tsx`; actualizar/añadir
   tests de integración y de formulario. Verificación final completa.
