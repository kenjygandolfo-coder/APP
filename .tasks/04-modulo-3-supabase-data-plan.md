# Módulo 3 — Capa de datos con Supabase (en el sequence de ramas: Módulo 4)

> El usuario lo llama "Módulo 3". En nuestra secuencia de ramas es la capa de
> datos que sigue a Módulo 1 (cimientos), Módulo 2 (wizard de macros) y al
> módulo de autenticación. El fichero se numera `04-` para no colisionar con
> `03-modulo-3-auth-plan.md`, que ya existe.

## Objetivo
Integrar Supabase como Backend as a Service del módulo web `apps/macros-web`
(Vite + React + Tailwind, DOM real). Crear el esquema relacional que vincula a
los usuarios autenticados con su perfil y sus metas de macros, dejando la
arquitectura lista para registros diarios de alimentos, peso corporal y medidas
musculares. Añadir el cliente de Supabase seguro (variables de entorno), tipos
estrictos y hooks de TanStack Query para leer y guardar la meta de macros, sin
`useEffect` para el fetching.

## Superficie de trabajo (sin ambigüedad de arquitectura)
Todo vive en `apps/macros-web` (app web DOM) donde `@supabase/supabase-js` y
`@tanstack/react-query` funcionan con normalidad. NO se toca la app Expo raíz.

## Rama propuesta
- **Nueva rama:** `feat/modulo-4-supabase-data`
- **Basada en:** `feat/modulo-3-auth` (para que existan el scaffold de
  macros-web, su tooling y el módulo de auth). Es un **PR apilado** cuya base
  de PR es `feat/modulo-3-auth`.

## Reglas duras (steering)
- TypeScript estricto; **prohibido `any`**. Tipos de BD escritos a mano que
  compilan (se documenta el camino opcional `supabase gen types typescript`,
  sin depender del CLI de Supabase).
- **Seguridad:** cliente de Supabase inicializado SOLO desde variables de
  entorno con prefijo `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`);
  error claro si faltan. `.env.example` con valores vacíos; `.env`/`.env.*`
  ignorados por git (se mantiene `!.env.example`). Sin secretos hardcodeados.
  **RLS** habilitado en las 4 tablas con políticas explícitas por comando
  (SELECT/INSERT/UPDATE/DELETE) restringidas a `auth.uid()` (INSERT con
  `WITH CHECK`, UPDATE con `USING` + `WITH CHECK`). La autorización vive en
  RLS, no en el cliente. Sin `console.log` (ESLint `no-console`): si hace falta
  un punto de log, se usa un callback inyectable.
- **Modelo de datos:** PKs UUID (`gen_random_uuid()`), `created_at`/`updated_at`
  timestamptz con trigger reutilizable `set_updated_at()`, FKs a `auth.users`
  `ON DELETE CASCADE`, índices útiles (user_id y columnas de fecha). Concepto de
  "meta activa" en `macro_goals` vía índice único parcial sobre `is_active`.
- **Inmutabilidad y clean code:** funciones de datos puras y asíncronas que
  retornan datos o lanzan errores claros (PostgrestError mapeado a un Error no
  filtrante). Muchos archivos pequeños (200–400 líneas típico, 800 máx.),
  funciones < 50 líneas.
- **Estado:** TanStack Query para fetch + mutación. `useMacroGoal()` (lectura) y
  `useSaveMacroGoal()` (upsert, invalida la query al tener éxito). Expone
  `isLoading`/`isError` y `isPending`. Sin `useEffect` para fetching.
- **Testing:** cobertura mínima 80%; unit + integration. Funciones de datos con
  cliente de Supabase mockeado (éxito + mapeo de error); hooks con wrapper de
  QueryClient (loading → success y error). Vitest + React Testing Library
  (`renderHook`). SQL/RLS no se puede testear sin BD viva: se valida
  estáticamente y se documenta para el SQL editor de Supabase.
- **Git:** conventional commits.

## Modelo relacional
- `profiles` — 1:1 con `auth.users` (PK `id` = `auth.users.id`, cascade).
- `macro_goals` — meta de macros: `goal_type` enum
  (`deficit`/`mantenimiento`/`volumen`), `tdee`, `calorie_target`,
  `protein_g`/`fat_g`/`carbs_g`, `is_active`, FK `user_id`. Alineado con el
  shape existente `MacroResult` (calorieTarget/tdee + gramos de macros).
- `weight_logs` — histórico de peso corporal (`weight_kg`, `logged_on`).
- `food_logs` — ingesta diaria estructurada (`logged_on`, `name`, `quantity`,
  `unit`, `calories`, macros en gramos).

Decisión "meta activa": una sola meta activa por usuario mediante índice único
parcial `UNIQUE (user_id) WHERE is_active`, consultada por el read hook.

## Features (ordenadas; dependencias primero)
1. **FEAT-001 (chore)** — Setup de entorno y config segura: instalar
   `@supabase/supabase-js` + `@tanstack/react-query`; cliente desde `VITE_`
   envs con error claro; `.env.example`; actualizar `.gitignore`; baseline
   verde (con el energy domain materializado temporalmente desde `main`, sin
   commitear, para resolver el alias `@energy`).
2. **FEAT-002 (feat)** — Migración SQL (esquema + triggers + RLS) en
   `supabase/migrations/0001_init.sql` y tipos estrictos de BD en
   `src/data/database.types.ts` que calzan con el esquema (sin `any`).
3. **FEAT-003 (feat)** — Capa de acceso a datos (funciones puras async con
   mapeo de errores), setup de QueryClientProvider y los hooks `useMacroGoal()`
   + `useSaveMacroGoal()`, más tests unitarios (cliente mockeado) y de hooks
   (estados de query/mutación).

## Comando de instalación exacto
```bash
cd apps/macros-web && npm install @supabase/supabase-js @tanstack/react-query
```

## Verificación
Desde `apps/macros-web`: `npm run typecheck`, `npm run lint`,
`npm run test -- --run` (cobertura 80%+), `npm run build`. Para el run completo
verde, materializar temporalmente `src/features/energy/domain` desde `main`
(sin commitear) para que el alias `@energy` resuelva en las suites preexistentes
del wizard. SQL/RLS: validación estática (grep de ENABLE RLS, 16 CREATE POLICY,
WITH CHECK en INSERT/UPDATE, ON DELETE CASCADE) + revisión por un pase experto
en bases de datos; ejecución real documentada para el SQL editor de Supabase
(no hay BD viva en el sandbox).

## Seam de integración con Auth
El cliente lee la sesión/usuario con `supabase.auth.getUser()`. El submit del
módulo de auth (`useAuthSubmit.ts`) sigue siendo un stub con logging redactado;
aquí NO se reemplaza por completo, sólo se documenta el punto donde el sign-in
real poblará la sesión que estos hooks consumen (vía `userId`).
