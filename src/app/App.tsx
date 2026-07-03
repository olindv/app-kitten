import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CreateCatScreen } from '../screens/CreateCatScreen';
import { GameScreen } from '../screens/GameScreen';
import { useProfileStore } from '../store/profileStore';
import { useHydration } from '../store/useHydration';

export type RootStackParamList = {
  CreateCat: undefined;
  Game: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function App() {
  const hydrated = useHydration();
  const hasProfile = useProfileStore((s) => s.profile !== null);

  // Сплэш до загрузки сохранения — чтобы не мигал экран создания у существующего игрока
  if (!hydrated) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {hasProfile ? (
              <Stack.Screen name="Game" component={GameScreen} />
            ) : (
              <Stack.Screen name="CreateCat" component={CreateCatScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#FFF7E6' },
});
