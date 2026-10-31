import { type ReactNode, useMemo } from 'react';
import { ScrollView, type ScrollViewProps, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TestId } from '../../util/test';
import { clx } from '../../util/util';

type BaseScreenProps<T extends 'view' | 'scroll'> = {
  children: ReactNode;
  /** Test id for e2e */
  testId: TestId;
} & (T extends 'view'
  ? {
      as: 'view';
    } & Omit<ViewProps, 'testID'>
  : {
      as?: 'scroll';
    } & Omit<ScrollViewProps, 'testID'>);

/**
 * Base screen
 * @param props
 */
function BaseScreen<T extends 'view' | 'scroll'>(props: BaseScreenProps<T>) {
  const { children, as, className, testId, ...rest } = props;

  // Hooks
  const inset = useSafeAreaInsets();

  // Memos
  const mainStyle = useMemo(
    () => ({
      paddingTop: inset.top,
      paddingBottom: inset.bottom,
      paddingLeft: inset.left,
      paddingRight: inset.right,
    }),
    [inset],
  );

  // Render
  return (
    <View className='bg-background flex-1' style={mainStyle}>
      {as === 'view' ? (
        <View testID={testId} className={clx('flex-1 p-base', className)} {...rest}>
          {children}
        </View>
      ) : (
        <ScrollView
          testID={testId}
          bounces={false}
          automaticallyAdjustKeyboardInsets
          contentContainerClassName={clx('grow p-base', className)}
          {...rest}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}

export default BaseScreen;
