import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import EmailResetRequestScreen from './screens/EmailResetRequestScreen';
import AdhesionFormScreen from './screens/AdhesionFormScreen'; // ✅ Ajouté
import SuccessScreen from './screens/SuccessScreen';
import WaitingValidationScreen from './screens/WaitingValidationScreen';


import { supabase } from './lib/supabase';

const Stack = createNativeStackNavigator();

function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigation.replace('AdhesionForm'); 
      } else {
        navigation.replace('Login');
      }
    };
    checkSession();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('./assets/logo.png')} style={styles.logo} />
      <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="EmailResetRequest" component={EmailResetRequestScreen} />
        <Stack.Screen name="AdhesionForm" component={AdhesionFormScreen} /> 
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="WaitingValidation" component={WaitingValidationScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  logo: {
    width: 400, height: 400, resizeMode: 'contain'
  }
});
