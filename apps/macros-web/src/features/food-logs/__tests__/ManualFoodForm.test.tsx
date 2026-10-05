import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { COPY } from '../copy.es';
import { ManualFoodForm } from '../ManualFoodForm';
import type { AddFoodLogInput, FoodLog } from '../types';

type MutateOptions = {
  readonly onSuccess?: (saved: FoodLog) => void;
};

type MutateFn = (input: AddFoodLogInput, options?: MutateOptions) => void;
type MockMutate = Mock<MutateFn>;

interface MutationState {
  mutate: MockMutate;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
}

const mutationState: MutationState = {
  mutate: vi.fn<MutateFn>(),
  isPending: false,
  isError: false,
  isSuccess: false,
};

vi.mock('../useAddFoodLog', () => ({
  useAddFoodLog: () => mutationState,
}));

const USER_ID = 'user-123';

function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  return (async () => {
    await user.type(
      screen.getByLabelText(COPY.form.fields.name),
      'Pechuga de pollo',
    );
    await user.type(screen.getByLabelText(COPY.form.fields.calories), '165');
    await user.type(screen.getByLabelText(COPY.form.fields.protein), '31');
    await user.type(screen.getByLabelText(COPY.form.fields.fat), '3.6');
    await user.type(screen.getByLabelText(COPY.form.fields.carbs), '0');
  })();
}

describe('ManualFoodForm', () => {
  beforeEach(() => {
    mutationState.mutate = vi.fn<MutateFn>();
    mutationState.isPending = false;
    mutationState.isError = false;
    mutationState.isSuccess = false;
  });

  it('submits the validated numeric payload with the user id', async () => {
    const user = userEvent.setup();
    render(<ManualFoodForm userId={USER_ID} />);

    await fillValidFields(user);
    await user.click(
      screen.getByRole('button', { name: COPY.form.submit }),
    );

    await waitFor(() => expect(mutationState.mutate).toHaveBeenCalledTimes(1));
    const call = mutationState.mutate.mock.calls[0];
    if (!call) {
      throw new Error('mutate was not called');
    }
    const [payload] = call;
    expect(payload).toEqual({
      user_id: USER_ID,
      name: 'Pechuga de pollo',
      calories: 165,
      protein_g: 31,
      fat_g: 3.6,
      carbs_g: 0,
    });
    // Numeric fields must be real numbers, not strings.
    expect(typeof payload.calories).toBe('number');
    expect(typeof payload.protein_g).toBe('number');
    expect(typeof payload.fat_g).toBe('number');
    expect(typeof payload.carbs_g).toBe('number');
  });

  it('clears the inputs after a successful save (reset via onSuccess)', async () => {
    const user = userEvent.setup();
    const savedRow = { logged_on: '2026-10-05' } as FoodLog;
    mutationState.mutate = vi.fn<MutateFn>((_input, options) => {
      options?.onSuccess?.(savedRow);
    });

    render(<ManualFoodForm userId={USER_ID} />);
    await fillValidFields(user);
    await user.click(screen.getByRole('button', { name: COPY.form.submit }));

    await waitFor(() => {
      expect(screen.getByLabelText(COPY.form.fields.name)).toHaveValue('');
    });
    expect(screen.getByLabelText(COPY.form.fields.calories)).toHaveValue(null);
    expect(screen.getByLabelText(COPY.form.fields.protein)).toHaveValue(null);
    expect(screen.getByLabelText(COPY.form.fields.fat)).toHaveValue(null);
    expect(screen.getByLabelText(COPY.form.fields.carbs)).toHaveValue(null);
  });

  it('blocks submission when the name is empty', async () => {
    const user = userEvent.setup();
    render(<ManualFoodForm userId={USER_ID} />);

    await user.type(screen.getByLabelText(COPY.form.fields.calories), '100');
    await user.click(screen.getByRole('button', { name: COPY.form.submit }));

    expect(
      await screen.findByText(COPY.form.errors.required),
    ).toBeInTheDocument();
    expect(mutationState.mutate).not.toHaveBeenCalled();
  });

  it('blocks submission when calories are negative', async () => {
    const user = userEvent.setup();
    render(<ManualFoodForm userId={USER_ID} />);

    await user.type(
      screen.getByLabelText(COPY.form.fields.name),
      'Pan integral',
    );
    await user.type(screen.getByLabelText(COPY.form.fields.calories), '-10');
    await user.click(screen.getByRole('button', { name: COPY.form.submit }));

    expect(
      await screen.findByText(COPY.form.errors.nonNegative),
    ).toBeInTheDocument();
    expect(mutationState.mutate).not.toHaveBeenCalled();
  });

  it('renders a friendly error message, never the raw error, on failure', () => {
    mutationState.isError = true;
    render(<ManualFoodForm userId={USER_ID} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(COPY.form.error);
    expect(alert.textContent ?? '').not.toMatch(/postgrest|supabase|Error:/i);
  });

  it('disables the submit button and shows submitting copy while pending', () => {
    mutationState.isPending = true;
    render(<ManualFoodForm userId={USER_ID} />);

    const button = screen.getByRole('button', { name: COPY.form.submitting });
    expect(button).toBeDisabled();
  });

  it('shows the success copy after a save', () => {
    mutationState.isSuccess = true;
    render(<ManualFoodForm userId={USER_ID} />);

    expect(screen.getByRole('status')).toHaveTextContent(COPY.form.success);
  });
});
