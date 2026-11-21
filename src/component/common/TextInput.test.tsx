import { render, screen, userEvent } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';

import { testId } from '@/util/test';

import TextInput from './TextInput';

describe('TextInput', () => {
  it('renders value and placeholder', async () => {
    await render(
      <TextInput testId={testId('unit-text-input')} value='hello' placeholder='Type here' />,
    );

    const input = screen.getByTestId('unit-text-input');
    expect(input).toBeVisible();
    expect(input).toHaveProp('value', 'hello');
    expect(input).toHaveProp('placeholder', 'Type here');
  });

  it('calls onChangeText while typing', async () => {
    const onChangeText = vi.fn();
    const user = userEvent.setup();

    await render(<TextInput testId={testId('unit-text-input')} onChangeText={onChangeText} />);

    await user.type(screen.getByTestId('unit-text-input'), 'abc');

    expect(onChangeText).toHaveBeenLastCalledWith('abc');
  });

  it('is disabled when not editable', async () => {
    await render(<TextInput testId={testId('unit-text-input')} value='x' editable={false} />);

    expect(screen.getByTestId('unit-text-input')).toBeDisabled();
    expect(screen.getByTestId('unit-text-input')).toHaveProp('editable', false);
  });

  it('conceals the value when secure', async () => {
    await render(<TextInput testId={testId('unit-text-input')} value='secret' secureTextEntry />);

    expect(screen.getByTestId('unit-text-input')).toHaveProp('secureTextEntry', true);
  });

  it('merges the custom className', async () => {
    await render(<TextInput testId={testId('unit-text-input')} value='' className='m-lg' />);

    const { className } = screen.getByTestId('unit-text-input').props;
    expect(className).toContain('border-primary');
    expect(className).toContain('m-lg');
  });
});
