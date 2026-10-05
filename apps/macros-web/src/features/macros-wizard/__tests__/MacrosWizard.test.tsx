import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { calculateMacros, type TdeeInput } from '../../../domain';
import { MacrosWizard } from '../MacrosWizard';

interface WizardAnswers {
  readonly sex: 'male' | 'female';
  readonly ageYears: string;
  readonly weightKg: string;
  readonly heightCm: string;
  readonly activityLabel: string;
}

async function fillStep1(user: ReturnType<typeof userEvent.setup>, a: WizardAnswers) {
  await user.selectOptions(screen.getByLabelText('Género'), a.sex);
  await user.type(screen.getByLabelText('Edad'), a.ageYears);
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

async function fillStep2(user: ReturnType<typeof userEvent.setup>, a: WizardAnswers) {
  await user.type(screen.getByLabelText('Peso (kg)'), a.weightKg);
  await user.type(screen.getByLabelText('Altura (cm)'), a.heightCm);
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

async function fillStep3(user: ReturnType<typeof userEvent.setup>, a: WizardAnswers) {
  await user.selectOptions(
    screen.getByLabelText('Nivel de actividad'),
    a.activityLabel,
  );
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

async function completeWizard(user: ReturnType<typeof userEvent.setup>, a: WizardAnswers) {
  await fillStep1(user, a);
  await fillStep2(user, a);
  await fillStep3(user, a);
}

const MALE: WizardAnswers = {
  sex: 'male',
  ageYears: '30',
  weightKg: '80',
  heightCm: '180',
  activityLabel: 'Moderado',
};

const FEMALE: WizardAnswers = {
  sex: 'female',
  ageYears: '28',
  weightKg: '62',
  heightCm: '165',
  activityLabel: 'Ligeramente activo',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MacrosWizard', () => {
  it('blocks advancing from step 1 when fields are empty', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Selecciona un género.')).toBeInTheDocument();
    // Empty string coerces to 0, which fails the positive() check.
    expect(
      screen.getByText('La edad debe ser mayor que cero.'),
    ).toBeInTheDocument();
    // Still on step 1.
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Peso (kg)')).not.toBeInTheDocument();
  });

  it('shows a validation error for an invalid age and stays on step 1', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await user.selectOptions(screen.getByLabelText('Género'), 'male');
    await user.type(screen.getByLabelText('Edad'), '0');
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(
      await screen.findByText('La edad debe ser mayor que cero.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
  });

  it('reaches results with the correct numbers for a man', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await completeWizard(user, MALE);

    expect(await screen.findByText(/paso 4 de 4/i)).toBeInTheDocument();

    const expected = calculateMacros({
      sex: 'male',
      ageYears: 30,
      weightKg: 80,
      heightCm: 180,
      activityLevel: 'moderate',
    } satisfies TdeeInput);

    expect(
      screen.getByText(`${expected.calorieTarget} kcal`),
    ).toBeInTheDocument();

    const proteinRow = screen.getByText('Proteína').closest('li');
    expect(proteinRow).not.toBeNull();
    expect(
      within(proteinRow as HTMLElement).getByText(
        `${expected.protein.grams} g`,
      ),
    ).toBeInTheDocument();
  });

  it('reaches results with the correct numbers for a woman', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await completeWizard(user, FEMALE);

    expect(await screen.findByText(/paso 4 de 4/i)).toBeInTheDocument();

    const expected = calculateMacros({
      sex: 'female',
      ageYears: 28,
      weightKg: 62,
      heightCm: 165,
      activityLevel: 'light',
    } satisfies TdeeInput);

    expect(
      screen.getByText(`${expected.calorieTarget} kcal`),
    ).toBeInTheDocument();

    const carbsRow = screen.getByText('Carbohidratos').closest('li');
    expect(
      within(carbsRow as HTMLElement).getByText(`${expected.carbs.grams} g`),
    ).toBeInTheDocument();
  });

  it('preserves entered values when using "Corregir datos"', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await completeWizard(user, MALE);
    await screen.findByText(/paso 4 de 4/i);

    await user.click(screen.getByRole('button', { name: 'Corregir datos' }));

    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Edad')).toHaveValue(30);
    expect(screen.getByLabelText('Género')).toHaveValue('male');

    // Step 2 values survived too.
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue(80);
    expect(screen.getByLabelText('Altura (cm)')).toHaveValue(180);
  });

  it('shows a success banner on save without using console', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await completeWizard(user, MALE);
    await screen.findByText(/paso 4 de 4/i);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar mis metas' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        /guardaron con éxito/i,
      );
    });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('navigates back to a previous step', async () => {
    const user = userEvent.setup();
    render(<MacrosWizard />);

    await fillStep1(user, MALE);
    expect(screen.getByText(/paso 2 de 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Edad')).toHaveValue(30);
  });
});
