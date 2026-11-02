import { useMemo, useState } from 'react';
import { PanResponder, View } from 'react-native';

import type { TestId } from '../../util/test';
import { clx } from '../../util/util';

type SliderProps = {
  /** Current value */
  value: number;
  /** Minimum value */
  minimumValue: number;
  /** Maximum value */
  maximumValue: number;
  /** Step between values */
  step?: number;
  /** Called on every change */
  onValueChange: (value: number) => void;
  /** Disabled */
  disabled?: boolean;
  /** Test id for e2e */
  testId: TestId;
  className?: string;
};

/**
 * Horizontal slider component
 * @param props
 */
function Slider(props: SliderProps) {
  const {
    value,
    minimumValue,
    maximumValue,
    step = 1,
    onValueChange,
    disabled,
    testId,
    className,
  } = props;

  // State
  const [width, setWidth] = useState(0);

  // Memo
  const percent = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

  // Memo
  const panResponder = useMemo(() => {
    const handleTouch = (x: number) => {
      if (disabled || width <= 0) return;
      const ratio = Math.min(1, Math.max(0, x / width));
      const raw = minimumValue + ratio * (maximumValue - minimumValue);
      const stepped = Math.round(raw / step) * step;
      const next = Math.min(maximumValue, Math.max(minimumValue, stepped));
      if (next !== value) onValueChange(next);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: event => handleTouch(event.nativeEvent.locationX),
      onPanResponderMove: event => handleTouch(event.nativeEvent.locationX),
    });
  }, [disabled, width, value, minimumValue, maximumValue, step, onValueChange]);

  // Render
  return (
    <View
      testID={testId}
      className={clx('h-11 w-full justify-center', disabled && 'opacity-50', className)}
      accessibilityRole='adjustable'
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View className='bg-muted h-2 w-full rounded-full'>
        <View className='bg-primary h-full rounded-full' style={{ width: `${percent}%` }} />
      </View>
      <View
        className='border-primary bg-background absolute h-6 w-6 rounded-full border-2'
        style={{ left: `${percent}%`, marginLeft: -12 }}
      />
    </View>
  );
}

export default Slider;
