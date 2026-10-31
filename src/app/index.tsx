import LocaleText from '@/component/common/LocaleText';
import BaseScreen from '@/component/navigation/BaseScreen';
import { testId } from '@/util/test';

function App() {
  // Render
  return (
    <BaseScreen testId={testId('home-screen')}>
      <LocaleText testId={testId('home-yes')} text='general:yes' />
    </BaseScreen>
  );
}

export default App;
