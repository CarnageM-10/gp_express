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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');

  const navigation = useNavigation();

const handleSubmit = async () => {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  // Validation simple du mail
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    alert('Format d’email invalide, il doit contenir un "@" et un "."');
    return;
  }

  // Inscription via Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (error) {
    alert('Erreur: ' + error.message);
    return;
  }

  const user = data?.user;

  if (user) {
    // Insertion dans la table "profiles"
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        name: name,
        email: cleanEmail,
        number: number,
      },
    ]);

    if (profileError) {
      alert('Erreur lors de la création du profil: ' + profileError.message);
      return;
    }

    alert('Inscription réussie !');
    navigation.navigate('Login');
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require('../assets/register.png')} style={styles.topImage} />

        <View style={styles.formContainer}>
          

          <TextInput
            style={styles.input}
            placeholder="Nom"
            placeholderTextColor="black"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="black"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Numéro"
            placeholderTextColor="black"
            keyboardType="phone-pad"
            value={number}
            onChangeText={setNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="black"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Le bouton "Register" avec le style du bas, déplacé ici */}
          <TouchableOpacity onPress={handleSubmit} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
            <View style={styles.logoGroup}>
              <Text style={styles.logoText}>Register</Text>
              <Image source={require('../assets/contracter.png')} style={styles.logo} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.registerButton}>Login</Text>
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
