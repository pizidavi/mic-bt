import { View } from 'react-native';

import type { TestId } from '../../util/test';
import { clx } from '../../util/util';

type VuMeterProps = {
  /** Speaking level percent 0..100 */
  level: number;
  /** Test id for e2e */
  testId: TestId;
  className?: string;
};

/**
 * VU meter bar reflecting the speaking level
 * @param props
 */
function VuMeter(props: VuMeterProps) {
  const { level, testId, className } = props;

  // Memo
  const percent = Math.min(100, Math.max(0, Math.round(level)));

  // Render
  return (
    <View
      testID={testId}
      className={clx('h-3 w-full overflow-hidden rounded-full bg-muted', className)}
      accessibilityRole='progressbar'
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View
        className={clx('h-full rounded-full', percent > 85 ? 'bg-destructive' : 'bg-primary')}
        style={{ width: `${percent}%` }}
      />
    </View>
  );
}

export default VuMeter;
