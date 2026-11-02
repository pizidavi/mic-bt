import { RotateCcw } from 'lucide-react-native';
import { View } from 'react-native';

import type { Dictionary } from '../../locale';
import { LOOPBACK_STOP_REASON } from '../../type/enum';
import { testId } from '../../util/test';
import Button from '../common/Button';
import LocaleText from '../common/LocaleText';

const REASON_TEXT: Record<LOOPBACK_STOP_REASON, Dictionary> = {
  [LOOPBACK_STOP_REASON.FOCUS_LOSS]: 'home:reason-focus-loss',
};

type StopReasonBannerProps = {
  /** Reason why the loopback stopped */
  reason: LOOPBACK_STOP_REASON;
  /** Restart callback */
  onRestart: () => void;
};

/**
 * Banner explaining why the loopback stopped, with a one-tap restart
 * @param props
 */
function StopReasonBanner(props: StopReasonBannerProps) {
  const { reason, onRestart } = props;

  // Render
  return (
    <View
      testID={testId('home-stop-reason-banner')}
      className='gap-base border-primary p-base rounded border'
    >
      <LocaleText testId={testId('home-stop-reason')} text={REASON_TEXT[reason]} />
      <Button
        testId={testId('home-restart-button')}
        text='home:restart'
        theme='outline'
        icon={RotateCcw}
        onPress={onRestart}
      />
    </View>
  );
}

export default StopReasonBanner;
