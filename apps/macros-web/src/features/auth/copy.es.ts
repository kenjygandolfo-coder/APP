/**
 * All Spanish UI strings for the Auth screens (Login + Registro), frozen so
 * copy stays immutable. Mirrors the macros-wizard copy.es.ts pattern. FEAT-003
 * consumes these keys when building the Login and Registro components.
 */
export const COPY = Object.freeze({
  login: Object.freeze({
    title: 'Bienvenido de vuelta',
    subtitle: 'Inicia sesión para seguir con tus metas de fitness.',
    submit: 'Iniciar sesión',
    switchPrompt: '¿No tienes cuenta? Regístrate',
    success: '¡Sesión iniciada con éxito!',
  }),
  register: Object.freeze({
    title: 'Crea tu cuenta',
    subtitle: 'Regístrate para empezar tu camino hacia una vida más saludable.',
    submit: 'Crear cuenta',
    switchPrompt: '¿Ya tienes cuenta? Inicia sesión',
    success: '¡Cuenta creada con éxito!',
  }),
  fields: Object.freeze({
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
  }),
  placeholders: Object.freeze({
    email: 'tucorreo@ejemplo.com',
    password: 'Tu contraseña',
    confirmPassword: 'Repite tu contraseña',
  }),
  session: Object.freeze({
    signOut: 'Cerrar sesión',
    goalLoading: 'Cargando tu meta de macros...',
    goalActive: 'Tienes una meta de macros activa.',
    goalEmpty: 'Aún no has guardado una meta de macros.',
  }),
});
