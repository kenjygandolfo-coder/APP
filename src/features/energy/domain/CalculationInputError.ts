export interface FieldIssue {
  readonly field: string;
  readonly message: string;
}

/** Thrown when calculator input is invalid. Never includes the raw input values. */
export class CalculationInputError extends Error {
  readonly issues: readonly FieldIssue[];

  constructor(issues: readonly FieldIssue[]) {
    super('Invalid calculation input');
    this.name = 'CalculationInputError';
    this.issues = Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
    Object.setPrototypeOf(this, CalculationInputError.prototype);
  }
}
