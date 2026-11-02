import Button from '@/component/common/Button';
import LocaleText from '@/component/common/LocaleText';
import StopReasonBanner from '@/component/home/StopReasonBanner';
import BaseScreen from '@/component/navigation/BaseScreen';
import { useLoopbackAudio } from '@/hook/useLoopbackAudio';
import type { Dictionary } from '@/locale';
import { LOOPBACK_STATE } from '@/type/enum';
import { testId } from '@/util/test';

const STATUS_TEXT: Record<LOOPBACK_STATE, Dictionary> = {
  [LOOPBACK_STATE.IDLE]: 'home:status-idle',
  [LOOPBACK_STATE.RUNNING]: 'home:status-running',
  [LOOPBACK_STATE.STOPPED]: 'home:status-stopped',
};

function App() {
  // Hook
  const { state, running, stopped, reason, busy, toggle, start } = useLoopbackAudio();

  // Memo
  const statusText = STATUS_TEXT[state];

  // Render
  return (
    <BaseScreen testId={testId('home-screen')}>
      <LocaleText testId={testId('home-yes')} text='general:yes' />
      <LocaleText testId={testId('home-status')} text={statusText} />
      <Button
        testId={running ? testId('home-stop-button') : testId('home-start-button')}
        text={running ? 'home:stop' : 'home:start'}
        onPress={toggle}
        loading={busy}
      />
      {stopped && reason !== null && <StopReasonBanner reason={reason} onRestart={start} />}
    </BaseScreen>
  );
}

export default App;
