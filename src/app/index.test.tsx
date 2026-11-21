import { render, screen, userEvent } from '@testing-library/react-native';
import i18next from 'i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import '@/locale';
import { LANGUAGE } from '@/type/enum';

import App from './index';

const state = vi.hoisted(() => ({
  running: false,
  busy: false,
  toggle: vi.fn(),
}));

vi.mock('@/hook/useLoopbackAudio', () => ({ useLoopbackAudio: () => state }));

beforeAll(async () => {
  await i18next.changeLanguage(LANGUAGE.EN);
});

beforeEach(() => {
  Object.assign(state, { running: false, busy: false });
  state.toggle.mockClear();
});

const renderApp = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, bottom: 0, right: 0 },
      }}
    >
      <App />
    </SafeAreaProvider>,
  );

describe('Home screen', () => {
  it('renders inside the base screen with the start button when idle', async () => {
    await renderApp();

    expect(screen.getByTestId('home-screen').type).toBe('RCTScrollView');
    expect(screen.getByTestId('home-yes')).toHaveTextContent('Yes');
    expect(screen.getByText('Start')).toBeVisible();
    expect(screen.queryByTestId('home-stop-button')).toBeNull();
  });

  it('starts the loopback when pressing the start button', async () => {
    const user = userEvent.setup();

    await renderApp();

    await user.press(screen.getByTestId('home-start-button'));

    expect(state.toggle).toHaveBeenCalledTimes(1);
  });

  it('shows the stop button when the loopback is running', async () => {
    state.running = true;

    await renderApp();

    expect(screen.getByText('Stop')).toBeVisible();
    expect(screen.queryByTestId('home-start-button')).toBeNull();
  });

  it('shows the spinner while busy', async () => {
    state.busy = true;

    await renderApp();

    expect(screen.getByTestId('home-start-button')).toBeDisabled();
    const spinner = screen.root?.queryAll(node => node.props.animating === true) ?? [];
    expect(spinner).toHaveLength(1);
  });
});
