import Button from '@/component/common/Button';
import LocaleText from '@/component/common/LocaleText';
import BaseScreen from '@/component/navigation/BaseScreen';
import { useLoopbackAudio } from '@/hook/useLoopbackAudio';
import { testId } from '@/util/test';

function App() {
  // Hook
  const { running, busy, toggle } = useLoopbackAudio();

  // Render
  return (
    <BaseScreen testId={testId('home-screen')}>
      <LocaleText testId={testId('home-yes')} text='general:yes' />
      <Button
        testId={running ? testId('home-stop-button') : testId('home-start-button')}
        text={running ? 'home:stop' : 'home:start'}
        onPress={toggle}
        loading={busy}
      />
    </BaseScreen>
  );
}

export default App;
