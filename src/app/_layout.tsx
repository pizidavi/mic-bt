import { Slot } from 'expo-router';

import '../global.css';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaListener, SafeAreaProvider } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

function RootLayout() {
  // Render
  return (
    <SafeAreaProvider>
      <StatusBar />
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <Slot />
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}

export default RootLayout;
