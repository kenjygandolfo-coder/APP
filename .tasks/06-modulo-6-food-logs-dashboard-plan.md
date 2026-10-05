# Módulo 6 — Dashboard de Descuento de Macros + Registro Manual de Alimentos

> El usuario lo llama "Módulo 5" en prosa, pero el Módulo 5 (Supabase Auth) ya existe en
> `.tasks/` y `.agents/tasks/`. Este trabajo se apila sobre `feat/modulo-5-supabase-auth`,
> por lo que se secuencia como **Módulo 6** para evitar colisiones de nombres.

- **Rama propuesta:** `feat/modulo-6-food-logs-dashboard`
- **Rama base:** `feat/modulo-5-supabase-auth` (PR apilado)
- **Orden de merge:** #1 → #2 → #3 → #4 → #5 → este
- **Superficie:** solo `apps/macros-web/` (Vite + React + TS + Tailwind). El app Expo raíz NO se toca.

## Objetivo

Construir el Dashboard de descuento de macros en tiempo real y el registro manual de
alimentos, reutilizando el patrón ya probado de `macro-goals` y los componentes UI del
Módulo 2. Entrada manual únicamente: SIN búsqueda por IA ni base de datos externa de productos.

## Restricciones duras (steering)

- TypeScript estricto, cero `any`.
- SIN `useEffect` para fetching: solo TanStack Query (`useQuery` / `useMutation`).
- Reutilizar `FormCard`, `TextField`, `Button` (y `SelectField` si aplica) de `macros-wizard/components`.
- Mapeo de errores Postgrest no filtrante (`toClearError`: error crudo solo en `cause`).
- Inmutabilidad: `reduce` puro para sumas, objetos nuevos, constantes congeladas.
- Validación con zod de toda entrada de formulario.
- Sin `console.log` (ESLint `no-console`).
- Estados `isLoading` / `isError` elegantes.
- Cobertura mínima 80 %: pruebas unitarias + integración.

## Decisiones de cálculo / UX (razonadas)

- **consumed** = suma inmutable (reduce) de `calories`, `protein_g`, `fat_g`, `carbs_g` de los logs del día.
- **remaining** = meta − consumido por métrica. Puede ser **negativo**; NO se oculta.
- **Sobre presupuesto:** la **barra** se **clampa a 100 %**, pero el **número restante real**
  (posiblemente negativo) se muestra en un acento de **advertencia** (rosa/alerta) para que
  pasarse sea visible sin un clamp raro.
- **percent** de la barra siempre en `[0,100]` (clamp), incluso con restante negativo.
- **Sin meta activa:** estado amistoso con CTA, nunca crash ni `NaN`.
- La matemática vive en una función **pura y testeada** `summarizeDailyMacros(logs, goal)`
  en un módulo sin React.

## Defaults de columnas requeridas no pedidas al usuario

La tabla `food_logs` exige `name`, `quantity (> 0)` y `calories (>= 0)`. El formulario solo
pide name/calories/protein/fat/carbs. Decisión documentada: en la **capa de datos**,
`addFoodLog` aplica `quantity = 1` y `unit = 'serving'` (el formulario captura los macros
totales por porción, así que una porción mantiene satisfecho `CHECK (quantity > 0)` sin pedir
el dato al usuario). `calories` es entero (`CHECK >= 0`): se coacciona/redondea a entero;
los macros son `numeric` y aceptan decimales no negativos.

## Features

### FEAT-001 — Capa de datos, query keys, hooks y matemática pura
`food-logs/types.ts`, `queryKeys.ts` (keyed por userId **y** fecha → invalidación precisa por
fecha), `foodLogs.data.ts` (`getDailyFoodLogs`, `addFoodLog` con `toClearError` no filtrante),
`summarizeDailyMacros.ts` (puro), `useDailyFoodLogs(userId, date)` (`useQuery`, enabled solo con
userId y date), `useAddFoodLog(userId)` (`useMutation`, invalida `foodLogKeys.daily(userId,
saved.logged_on)` en `onSuccess`). Pruebas: data (éxito/vacío/no-filtra), summarize
(vacío/parcial/en-meta/sobre-meta/sin-meta), hooks (loading→success→error; spy de invalidación).

### FEAT-002 — Registro manual (schema + copy + ManualFoodForm)
`copy.es.ts` (congelado, en español), `schemas/foodLog.schema.ts` (zod: name no vacío,
calories entero >= 0, macros numéricos >= 0), `ManualFoodForm.tsx` (RHF + zodResolver, reutiliza
FormCard/TextField/Button, envía con `useAddFoodLog`, **limpia** con `reset()` en éxito).
Pruebas: schema + integración (mutate recibe payload validado; el form se limpia; input inválido
bloquea el submit; error muestra copy amistosa).

### FEAT-003 — DailyDashboard + wiring en App
`components/MacroProgressBar.tsx`, `DailyDashboard.tsx` (consume `useMacroGoal` +
`useDailyFoodLogs` + `summarizeDailyMacros`; estados loading/error/empty/no-goal; sobre-presupuesto
con acento de advertencia y barra clamped). Wiring en `App.tsx` detrás de la sesión autenticada.
Pruebas: DailyDashboard (todos los estados, incluido over-budget con barra al 100 % y restante
negativo). Actualizar `App.test.tsx` si cambia la nav.

## Verificación

Desde `apps/macros-web/`:

- `npx vitest run` (unit + integración)
- `npm run typecheck` (`tsc --noEmit`)
- `npm run lint` (ESLint: `no-console`, estricto)
- `npm run build`
- Cobertura: `npm run test:coverage` (objetivo >= 80 %)

**Nota sobre `@energy`:** las suites preexistentes de `macros-wizard`/`App` dependen del dominio
de energía del Módulo 1 (vive en `main`, no en esta rama) vía el alias `@energy`. Para correr la
suite completa en verde, materializar temporalmente `src/features/energy/domain` desde `main`
(`git show main:...`) y **eliminarlo antes de terminar** para que nunca entre en un commit. Las
nuevas suites de food-logs son autocontenidas (no dependen de `@energy`).

**Sin Supabase en vivo en el sandbox:** toda la capa de datos y los hooks se validan con un
`SupabaseClient` mockeado y un `QueryClient` wrapper, nunca contra una base real. E2E con backend
en vivo no es factible: se documenta en vez de ejecutarse.

## Entregable final (español, estructura de 4 secciones)

1. Resumen de Lógica
2. Código: Capa de Datos y Hooks
3. Código: Componente ManualFoodForm
4. Código: Componente DailyDashboard
