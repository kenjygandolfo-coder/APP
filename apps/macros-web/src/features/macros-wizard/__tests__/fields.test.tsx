import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { PrimaryButton, SecondaryButton } from '../components/Button';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';

function TextHarness({ error }: { error?: string }): JSX.Element {
  const { register } = useForm();
  return (
    <TextField
      id="age"
      label="Edad"
      register={register('age')}
      error={error}
    />
  );
}

function SelectHarness({ error }: { error?: string }): JSX.Element {
  const { register } = useForm();
  return (
    <SelectField
      id="sex"
      label="Género"
      register={register('sex')}
      options={[{ value: 'male', label: 'Hombre' }]}
      placeholder="Selecciona una opción"
      error={error}
    />
  );
}

describe('TextField', () => {
  it('renders a sage focus accent and no error by default', () => {
    render(<TextHarness />);
    const input = screen.getByLabelText('Edad');
    expect(input.className).toContain('focus:border-sage');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the error message and marks the input invalid', () => {
    render(<TextHarness error="Ingresa tu edad." />);
    const input = screen.getByLabelText('Edad');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresa tu edad.');
  });
});

describe('SelectField', () => {
  it('renders options, placeholder, and the sage focus accent', () => {
    render(<SelectHarness />);
    const select = screen.getByLabelText('Género');
    expect(select.className).toContain('focus:border-sage');
    expect(screen.getByText('Selecciona una opción')).toBeInTheDocument();
    expect(screen.getByText('Hombre')).toBeInTheDocument();
  });

  it('renders an error message when provided', () => {
    render(<SelectHarness error="Selecciona un género." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona un género.');
  });
});

describe('Buttons', () => {
  it('primary uses the sage fill and lifts on hover', () => {
    render(<PrimaryButton>Guardar</PrimaryButton>);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button.className).toContain('bg-sage');
    expect(button.className).toContain('hover:-translate-y-0.5');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('secondary uses the pink accent and can be disabled', () => {
    render(<SecondaryButton disabled>Atrás</SecondaryButton>);
    const button = screen.getByRole('button', { name: 'Atrás' });
    expect(button.className).toContain('border-pink');
    expect(button).toBeDisabled();
  });
});
