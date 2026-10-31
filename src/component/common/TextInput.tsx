import { useMemo } from 'react';
import { TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from 'react-native';

import type { TestId } from '../../util/test';
import { clx } from '../../util/util';

type TextInputProps = {
  /** Value */
  value?: string;
  /** Test id for e2e */
  testId: TestId;
  /** On change callback */
  onChangeText?: (text: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Placeholder color */
  placeholderTextColor?: string;
  /** Editable */
  editable?: boolean;
  /** Secure text entry */
  secureTextEntry?: boolean;
  /** Auto capitalize */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Auto correct */
  autoCorrect?: boolean;
  /** Custom className */
  className?: string;
} & Omit<
  RNTextInputProps,
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'editable'
  | 'secureTextEntry'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'testID'
>;

/**
 * TextInput component
 * @param props
 */
function TextInput(props: TextInputProps) {
  const {
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = '#999',
    editable = true,
    secureTextEntry = false,
    autoCapitalize = 'sentences',
    autoCorrect = true,
    className,
    testId,
    ...rest
  } = props;

  // Memo
  const inputClassName = useMemo(
    () =>
      clx(
        'min-h-11 rounded border border-primary bg-background px-4 text-base font-medium text-foreground',
        editable ? '' : 'opacity-60',
        className,
      ),
    [className, editable],
  );

  // Render
  return (
    <RNTextInput
      className={inputClassName}
      testID={testId}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      editable={editable}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      {...rest}
    />
  );
}

export default TextInput;
