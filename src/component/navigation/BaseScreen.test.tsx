import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { describe, expect, it } from 'vitest';

import { testId } from '@/util/test';

import BaseScreen from './BaseScreen';

const INSETS = { top: 10, left: 5, bottom: 20, right: 15 };
const label = 'content';

const renderScreen = (ui: ReactElement) =>
  render(
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: INSETS }}
    >
      {ui}
    </SafeAreaProvider>,
  );

describe('BaseScreen', () => {
  it('renders a scroll screen with the test id and children', async () => {
    await renderScreen(
      <BaseScreen testId={testId('unit-base-screen')}>
        <Text>{label}</Text>
      </BaseScreen>,
    );

    const container = screen.getByTestId('unit-base-screen');
    expect(container.type).toBe('RCTScrollView');
    expect(screen.getByText(label)).toBeVisible();
    expect(container).toHaveProp('bounces', false);
    expect(container).toHaveProp('automaticallyAdjustKeyboardInsets', true);
  });

  it('renders a plain view when as is view', async () => {
    await renderScreen(
      <BaseScreen as='view' testId={testId('unit-base-screen')}>
        <Text>{label}</Text>
      </BaseScreen>,
    );

    const container = screen.getByTestId('unit-base-screen');
    expect(container.type).toBe('RCTView');
    expect(screen.getByText(label)).toBeVisible();
  });

  it('applies the safe area insets as padding', async () => {
    await renderScreen(
      <BaseScreen testId={testId('unit-base-screen')}>
        <Text>{label}</Text>
      </BaseScreen>,
    );

    expect(screen.root?.props.style).toEqual({
      paddingTop: INSETS.top,
      paddingLeft: INSETS.left,
      paddingBottom: INSETS.bottom,
      paddingRight: INSETS.right,
    });
  });
});
