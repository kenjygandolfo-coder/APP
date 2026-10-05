import { fireEvent, render, screen } from '@testing-library/react-native';

import { WelcomeScreen } from '../WelcomeScreen';
import { WELCOME_COPY } from '../welcome.copy';

describe('WelcomeScreen', () => {
  it('renders the title and subtitle', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(WELCOME_COPY.title)).toBeTruthy();
    expect(screen.getByText(WELCOME_COPY.subtitle)).toBeTruthy();
  });

  it('hides the CTA when no onStart handler is provided', () => {
    render(<WelcomeScreen />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onStart when the CTA is pressed', () => {
    const onStart = jest.fn();
    render(<WelcomeScreen onStart={onStart} />);
    fireEvent.press(screen.getByRole('button', { name: WELCOME_COPY.ctaA11yLabel }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
