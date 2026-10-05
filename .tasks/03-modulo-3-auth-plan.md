# Módulo 3 — Autenticación (Login + Registro)

## Objetivo
Construir el flujo de autenticación (Login y Registro) para la app de fitness
multiplataforma, con almacenamiento seguro de tokens adaptable (Web vs Móvil),
validación con zod y una UI que respeta exactamente el estilo "Enchanted/Cozy".

## Tensión de arquitectura (y cómo se resuelve)
El prompt mezcla React Native (Expo) con clases **literales de Tailwind CSS**
(`focus:border-[#8a9a5b]`, `hover:-translate-y-0.5`, `backdrop-blur`), con
`expo-secure-store` (API nativa) y `localStorage` (API web). No se pueden
cumplir "clases Tailwind literales" y "expo-secure-store nativo" en el mismo
componente. Resolución (igual que el Módulo 2, ya aprobado):

- La **UI de Login/Registro se construye en `apps/macros-web`** (módulo
  Vite + React 18 + Tailwind, DOM real), reutilizando los tokens de diseño y
  los primitivos existentes (`FormCard`, `PrimaryButton/SecondaryButton`,
  patrón de `TextField`). Ahí las directivas Tailwind se renderizan tal cual.
- El **almacenamiento seguro** se resuelve con una **abstracción adaptable**:
  una interfaz `TokenStorage` con DOS implementaciones (web `localStorage` y
  nativa `expo-secure-store`) seleccionadas en runtime por plataforma. La web
  se entrega funcionando y testeada; la nativa queda lista (import diferido,
  con su comando de instalación exacto) para enchufarse en la app Expo por la
  MISMA interfaz.

## Rama propuesta
`feat/modulo-3-auth`, basada en `feat/modulo-2-macros-wizard` (para que exista
el módulo macros-web y su tooling). El código de auth es autocontenido y NO usa
el alias `@energy`; el set de tests completo queda verde en una rama que
contenga Módulo 1 (energy domain, hoy en `main`) y Módulo 2.

## Reglas duras (steering)
- TypeScript estricto en todo.
- Sin backend real: `onSubmit` inyectable, listo para API/Supabase. El "log de
  datos validados" se enruta por un logger inyectable que registra SOLO una
  forma redactada (email + longitud de contraseña, NUNCA la contraseña cruda),
  para mantener verde la regla ESLint `no-console`.
- Formularios con react-hook-form + @hookform/resolvers/zod + zod; errores por
  campo; match de contraseñas en Registro (cross-field `.refine`).
- Seguridad: `localStorage` es el fallback web (se documenta el riesgo XSS);
  `expo-secure-store` (Keychain/Keystore) es la ruta endurecida nativa. Sin
  secretos hardcodeados. No se registran contraseñas.
- Inmutabilidad; archivos pequeños y enfocados; funciones < 50 líneas.
- TDD; cobertura mínima 80%; unit + integration + E2E.

## Features
1. **FEAT-001 (feat)** — Almacenamiento seguro adaptable: interfaz
   `TokenStorage` (saveToken/getToken/deleteToken) + impl web (`localStorage`)
   + impl nativa (`expo-secure-store`, import diferido) + selección por
   plataforma + hook `useAuthStorage`. Tests unitarios (round-trip, delete,
   selección de plataforma, ramas de error).
2. **FEAT-002 (feat)** — Esquemas zod `loginSchema` y `registerSchema`
   (confirmación de contraseña con `.refine`), mensajes en español, copy
   congelado. Tests de esquema.
3. **FEAT-003 (feat)** — Componentes UI Login y Registro con los tokens de
   diseño y primitivos reutilizados, `onSubmit` inyectable + logger redactado,
   persistencia del token vía `useAuthStorage`, enrutado desde `App.tsx`. Tests
   de integración (errores, match de contraseñas, submit exitoso) + E2E
   Playwright.

## Verificación
Desde `apps/macros-web`: `npm run typecheck`, `npm run lint`,
`npm run test -- --run` (cobertura 80%+), `npm run build`,
`npm run test:e2e`.
