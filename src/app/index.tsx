import { Volume2, VolumeX } from 'lucide-react-native';
import { useMemo } from 'react';

import Button from '@/component/common/Button';
import LocaleText from '@/component/common/LocaleText';
import Slider from '@/component/common/Slider';
import VuMeter from '@/component/common/VuMeter';
import BaseScreen from '@/component/navigation/BaseScreen';
import { useLoopbackAudio } from '@/hook/useLoopbackAudio';
import { GAIN_MAX_DB, GAIN_MIN_DB, GAIN_STEP_DB } from '@/util/audio';
import { testId } from '@/util/test';

function App() {
  // Hook
  const { running, busy, toggle, gain, setGain, muted, toggleMute, level } = useLoopbackAudio();

  // Memo
  const gainValue = useMemo(() => `${gain > 0 ? '+' : ''}${Math.round(gain)} dB`, [gain]);

  // Render
  return (
    <BaseScreen as='scroll' className='gap-base' testId={testId('home-screen')}>
      <Button
        testId={running ? testId('home-stop-button') : testId('home-start-button')}
        text={running ? 'home:stop' : 'home:start'}
        onPress={toggle}
        loading={busy}
      />
      <VuMeter testId={testId('home-vu-meter')} level={level} />
      <LocaleText testId={testId('home-gain-label')} text='home:gain' />
      <Slider
        testId={testId('home-gain-slider')}
        value={gain}
        minimumValue={GAIN_MIN_DB}
        maximumValue={GAIN_MAX_DB}
        step={GAIN_STEP_DB}
        onValueChange={setGain}
        disabled={!running}
      />
      <LocaleText testId={testId('home-gain-value')} avoidTranslation text={gainValue} />
      <Button
        testId={muted ? testId('home-unmute-button') : testId('home-mute-button')}
        text={muted ? 'home:unmute' : 'home:mute'}
        icon={muted ? Volume2 : VolumeX}
        theme='outline'
        onPress={toggleMute}
        disabled={!running}
      />
    </BaseScreen>
  );
}

export default App;
