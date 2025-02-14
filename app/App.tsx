// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import LoginScreen from './index';
import Home from './Home';
import Header from './components/Header';
import EditProfile from './EditProfile';
import History from './History';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const App = () => (
  <PaperProvider>
  <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="History" component={History} />
      <Stack.Screen name="Header" component={Header} />
    </Stack.Navigator>
  </NavigationContainer>
  </PaperProvider>
);

export default App;