import { ACTIVITY_LABELS_ES } from '../../domain';

/**
 * All Spanish UI strings for the Macros wizard, frozen so copy stays
 * immutable. Activity option labels reuse the domain's ACTIVITY_LABELS_ES.
 */
export const COPY = Object.freeze({
  app: Object.freeze({
    title: 'Calculadora de Macros',
    subtitle: 'Un asistente paso a paso para descubrir tus metas de nutrición.',
  }),
  nav: Object.freeze({
    back: 'Atrás',
    next: 'Siguiente',
    stepIndicator: (current: number, total: number): string =>
      `Paso ${current} de ${total}`,
  }),
  steps: Object.freeze({
    genderAge: Object.freeze({
      title: 'Sobre ti',
      subtitle: 'Cuéntanos tu género y tu edad.',
    }),
    weightHeight: Object.freeze({
      title: 'Tus medidas',
      subtitle: 'Indica tu peso y tu altura.',
    }),
    activity: Object.freeze({
      title: 'Tu actividad',
      subtitle: 'Elige qué tan activo es tu día a día.',
    }),
    results: Object.freeze({
      title: 'Tus metas',
      subtitle: 'Esta es tu distribución diaria recomendada.',
    }),
  }),
  fields: Object.freeze({
    sex: 'Género',
    ageYears: 'Edad',
    weightKg: 'Peso (kg)',
    heightCm: 'Altura (cm)',
    activityLevel: 'Nivel de actividad',
  }),
  genderOptions: Object.freeze({
    male: 'Hombre',
    female: 'Mujer',
  }),
  activityOptions: ACTIVITY_LABELS_ES,
  placeholders: Object.freeze({
    select: 'Selecciona una opción',
  }),
  results: Object.freeze({
    calorieTarget: 'Objetivo de calorías',
    protein: 'Proteína',
    fat: 'Grasa',
    carbs: 'Carbohidratos',
    gramsUnit: 'g',
    kcalUnit: 'kcal',
  }),
  actions: Object.freeze({
    save: 'Guardar mis metas',
    edit: 'Corregir datos',
  }),
  saveSuccess: '¡Tus metas se guardaron con éxito!',
  calculationError:
    'No pudimos calcular tus metas. Revisa tus datos e inténtalo de nuevo.',
});
