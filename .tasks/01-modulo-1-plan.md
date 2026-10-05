# Módulo 1 — Plan de implementación

Cada paso tiene una verificación. No pases al siguiente hasta que la verificación esté en verde.

1. Prerrequisitos: Node 20 LTS, Git. (Para Android en tu PC: Android Studio + JDK 17.)
   Verificar: `node -v` → v20.x
2. Scaffold Expo dentro de APP (ver sección 2 del entregable).
   Verificar: `npx expo start --web` abre la app de ejemplo.
3. Instalar dependencias (expo-router, zod, jest-expo, Testing Library, Playwright, ESLint, serve).
   Verificar: `npm ls zod jest-expo @playwright/test` sin errores.
4. Configuración: package.json (main/scripts/jest), tsconfig, app.json, eslint, jest.setup, .gitignore, .env.example.
   Verificar: `npm run typecheck` y `npm run lint` pasan.
5. Crear la estructura de carpetas (sección 3) y borrar App.tsx / index.ts de la plantilla.
6. TDD de la calculadora — ROJO: escribir energyCalculator.test.ts.
   Verificar: `npm test` FALLA (todavía no existe la implementación).
7. VERDE: constantes, esquema, error y energyCalculator.ts.
   Verificar: `npm test` pasa y la cobertura del módulo es ≥ 95 %.
8. Pantalla de bienvenida: primero el test, luego el componente y las rutas.
   Verificar: `npm run test:coverage` ≥ 80 % global; `npm run web` muestra la bienvenida.
9. E2E: `npm run build:web && npx playwright install chromium && npm run test:e2e` pasa.
10. CI: `.github/workflows/ci.yml`. Verificar: los jobs test, build-web, e2e-web y build-android quedan en verde en el PR.
11. CLAUDE.md en la raíz. Revisar el checklist de seguridad (sin secretos; .env ignorado).
12. Commits convencionales (feat/test/ci/docs/chore) y abrir el PR.

Fuera de alcance: login, Supabase, UI de la calculadora (Módulo 2+).
