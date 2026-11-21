import { render, screen, userEvent } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';

import '@/locale';
import { testId } from '@/util/test';

import Button from './Button';

describe('Button', () => {
  it('renders the translated label and calls onPress', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    await render(
      <Button testId={testId('home-start-button')} text='home:start' onPress={onPress} />,
    );

    expect(screen.getByText('Start')).toBeVisible();

    await user.press(screen.getByTestId('home-start-button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    await render(
      <Button testId={testId('home-start-button')} text='home:start' onPress={onPress} disabled />,
    );

    const button = screen.getByTestId('home-start-button');
    expect(button).toBeDisabled();

    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows the spinner and blocks press while loading', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();

    await render(
      <Button testId={testId('home-start-button')} text='home:start' onPress={onPress} loading />,
    );

    const button = screen.getByTestId('home-start-button');
    expect(button).toBeDisabled();
    const spinner = screen.root?.queryAll(node => node.props.animating === true) ?? [];
    expect(spinner).toHaveLength(1);

    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
