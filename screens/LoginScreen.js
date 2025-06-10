import React, { useState } from 'react';
import {
  View,
  TextInput,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // <-- ajoute ceci

  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Merci de remplir email et mot de passe');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);

      if (error) {
        alert('Erreur: ' + error.message);
        return;
      }

      alert('Bienvenue !');

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        alert('Utilisateur non connecté');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        alert('Erreur lors de la vérification du profil : ' + profileError.message);
        return;
      }

      if (!profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          name: '',
          number: '',
        });

        if (insertError) {
          alert('Erreur lors de la création du profil : ' + insertError.message);
          return;
        }
      }

      navigation.replace('Home');  // <-- navigation vers Home
    } catch (e) {
      setLoading(false);
      alert('Erreur inattendue: ' + e.message);
    }
  };

  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/login.png')} style={styles.topImage} />

        <View style={styles.formContainer}>

          <TextInput
            style={[styles.input, { marginBottom: 50 }]}
            placeholder="Email"
            placeholderTextColor="black"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="black"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Bouton Login avec même style que Register */}
          <TouchableOpacity onPress={handleLogin} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
            <View style={styles.logoGroup}>
              <Text style={styles.logoText}>Login</Text>
              <Image source={require('../assets/padlock.png')} style={styles.logo} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButton}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
  },
  topImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
    marginBottom: 30,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    color: 'black',
    fontSize: 16,
    marginBottom: 25,
    paddingVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    alignItems: 'flex-end',
  },
  registerButton: {
    fontSize: 16,
    color: 'black',
    textDecorationLine: 'underline',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginRight: 10,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
});
