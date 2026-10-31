import { useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Text, type TextProps } from 'react-native';

import { type Dictionary } from '../../locale';
import { type TestId } from '../../util/test';
import { clx } from '../../util/util';

export type LocaleTextProps<T extends boolean = false> = {
  /** Text */
  text: T extends false ? Dictionary : string | number;
  /** Avoid translation */
  avoidTranslation?: T;
  /** Values */
  values?: Record<string, Dictionary | (string & {}) | number>;
  /** Components */
  components?: readonly React.ReactElement[] | Record<string, React.ReactElement>;
  /** Test id for e2e */
  testId?: TestId;
} & Omit<TextProps, 'children' | 'testID'>;

/**
 * LocaleText component
 * @param props
 */
function LocaleText<T extends boolean = false>(props: LocaleTextProps<T>) {
  const { text, avoidTranslation, className, values, components, testId, ...rest } = props;

  // Hooks
  const { t } = useTranslation();

  // Memos
  const translatedValues = useMemo(() => {
    if (!values) return;
    return Object.entries(values).reduce<typeof values>((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? t(value) : value;
      return acc;
    }, {});
  }, [t, values]);

  // Callbacks
  const BaseText = useCallback(
    (attributes: { children: React.ReactNode }) => (
      <Text
        className={clx('text-base font-medium text-foreground', className)}
        testID={testId}
        {...rest}
        {...attributes}
      />
    ),
    [className, rest, testId],
  );

  // Render
  return avoidTranslation ? (
    // oxlint-disable-next-line react/static-components
    <BaseText>{text}</BaseText>
  ) : (
    <Trans
      //@ts-expect-error this accept string
      i18nKey={text.toString()}
      values={translatedValues}
      components={components}
      parent={BaseText}
    />
  );
}
export default LocaleText;
