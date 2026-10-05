import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Confirms the "@energy" alias resolves the reused portable domain under Vitest.
import { calculateTdee } from '@energy';

import App from './App';

describe('App', () => {
  it('renders the app title as the top-level heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /calculadora de macros/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/asistente paso a paso para descubrir tus metas/i),
    ).toBeInTheDocument();
  });

  it('renders the macros wizard starting on step 1', () => {
    render(<App />);
    expect(screen.getByText(/paso 1 de 4/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /sobre ti/i }),
    ).toBeInTheDocument();
  });

  it('reuses the energy domain through the @energy alias', () => {
    const result = calculateTdee({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      ageYears: 30,
      activityLevel: 'moderate',
    });
    expect(result.tdee).toBeGreaterThan(0);
    expect(result.multiplier).toBe(1.55);
  });
});
