// Public domain surface for the macros web module.
// Re-exports the pure macro calculator plus the reused energy types/values
// the wizard UI needs, so UI code imports from a single '@/domain' barrel.

export {
  calculateMacros,
  type MacroBreakdown,
  type MacroResult,
} from './macroCalculator';
export {
  KCAL_PER_GRAM,
  type MacroName,
  MACRO_SPLIT,
} from './macros.constants';

export {
  ACTIVITY_LABELS_ES,
  ACTIVITY_LEVELS,
  type ActivityLevel,
  CalculationInputError,
  INPUT_LIMITS,
  SEXES,
  type Sex,
  type TdeeInput,
} from '@energy';
