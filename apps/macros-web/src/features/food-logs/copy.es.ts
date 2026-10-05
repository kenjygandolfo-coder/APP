/**
 * All Spanish UI strings for the food-logs feature, frozen so copy stays
 * immutable. Mirrors the auth/macros-wizard copy.es.ts convention.
 *
 * The `form` section feeds the manual entry form (FEAT-002); the `dashboard`
 * section is consumed by the daily summary dashboard (FEAT-003).
 */
export const COPY = Object.freeze({
  form: Object.freeze({
    title: 'Registrar alimento',
    subtitle: 'Añade los macros de lo que comiste hoy.',
    submit: 'Guardar alimento',
    submitting: 'Guardando...',
    success: '¡Alimento registrado con éxito!',
    error:
      'No se pudo guardar el alimento. Revisa los datos e inténtalo de nuevo.',
    fields: Object.freeze({
      name: 'Nombre del alimento',
      calories: 'Calorías (kcal)',
      protein: 'Proteína (g)',
      fat: 'Grasa (g)',
      carbs: 'Carbohidratos (g)',
    }),
    errors: Object.freeze({
      required: 'Ingresa el nombre del alimento.',
      nonNegative: 'El valor no puede ser negativo.',
      positive: 'Ingresa un número válido.',
      integer: 'Las calorías deben ser un número entero.',
    }),
  }),
  dashboard: Object.freeze({
    title: 'Resumen del día',
    remainingCalories: 'Calorías restantes',
    protein: 'Proteína',
    fat: 'Grasa',
    carbs: 'Carbohidratos',
    loading: 'Cargando tu resumen del día...',
    error: 'No se pudo cargar tu resumen. Inténtalo de nuevo más tarde.',
    empty: 'Aún no has registrado alimentos hoy.',
    noGoal:
      'Define una meta de macros para ver cuánto te queda por consumir hoy.',
    overBudget: 'Has superado tu meta.',
  }),
});
