# Módulo 2 — Calculadora de Macros (Wizard) — Plan de implementación

Rama propuesta: `feat/modulo-2-macros-wizard` (nueva, parte de `main`).

## Decisión de arquitectura (en breve)

El usuario pide **React + Tailwind CSS** con `<select>`, `<input>`, `backdrop-blur` y Google Fonts,
"listo para Vite/Next.js con Tailwind". El repo actual (`APP/`) es **Expo / React Native**, donde las
clases de Tailwind CSS y las etiquetas `<select>`/`<input>` del DOM **no** se renderizan. Son dos mundos
distintos. Por eso creamos un **módulo web nuevo e independiente** en `apps/macros-web/`
(Vite + React 18 + Tailwind CSS), que es una app React de DOM real. Reutilizamos la lógica de cálculo
pura de `src/features/energy/domain` (es TypeScript puro, sin imports de React Native, así que es portable)
en vez de reescribir Harris-Benedict.

Cada paso tiene verificación. No pases al siguiente hasta tenerla en verde.

1. **FEAT-001 — Scaffold del módulo web** (`chore`)
   Vite + React 18 + TS + Tailwind + Vitest + RTL + Playwright en `apps/macros-web/`.
   Tokens del diseño en `tailwind.config.ts` (colores con nombre, fuentes, radio 16px). Google Fonts en `index.html`.
   Verificar: `cd apps/macros-web && npm install && npm run typecheck && npm run build`.

2. **FEAT-002 — Matemática de macros PURA (TDD)** (`feat`)
   ROJO: `src/domain/__tests__/macroCalculator.test.ts` primero.
   VERDE: `src/domain/macroCalculator.ts` reutiliza `calculateTdee` del dominio de energía.
   Objetivo de calorías = TDEE de mantenimiento. Split por defecto (constantes con nombre):
   Proteína 30 % / Grasa 25 % / Carbohidratos 45 %; 4 kcal/g proteína, 4 kcal/g carbos, 9 kcal/g grasa.
   Verificar: `npm run test -- --run src/domain` pasa; cobertura del dominio ≥ 95 %.

3. **FEAT-003 — Wizard de 4 pantallas (UI + RHF)** (`feat`)
   Un único formulario `react-hook-form` + `zodResolver` que abarca los 4 pasos (los datos no se pierden).
   Pantalla 1 Género/Edad · 2 Peso/Altura · 3 Actividad · 4 Resultados (calorías + gramos de macros).
   Validación por paso con `trigger()` antes de avanzar.
   "Guardar mis metas" → estado visual de éxito (SIN `console.log`, por la regla ESLint no-console).
   "Corregir datos" → vuelve al paso 1 sin perder datos.
   Estilo "Enchanted/Cozy" con tokens de Tailwind (crema, salvia, rosa; tarjeta translúcida + backdrop-blur;
   Montserrat + Playfair Display; hover lift; `focus:border` salvia).
   Tests de integración (navegación + bloqueo por validación + preservación de datos + éxito) y E2E Playwright.
   Verificar: `npm run test:coverage -- --run` ≥ 80 % global; `npm run typecheck && npm run lint && npm run build`; `npm run test:e2e`.

## Fuera de alcance
Login, Supabase/backend, persistencia real, ajuste de objetivo (déficit/superávit). El objetivo de calorías
es la TDEE de mantenimiento del Módulo 1.
