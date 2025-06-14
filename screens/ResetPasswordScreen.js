import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    // Récupérer le lien d'ouverture et extraire le token access_token
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsed = Linking.parse(initialUrl);
        if (parsed.queryParams && parsed.queryParams.access_token) {
          setAccessToken(parsed.queryParams.access_token);
        } else {
          Alert.alert('Erreur', 'Lien de réinitialisation invalide.');
        }
      }
    };
    getUrlAsync();
  }, []);

  const isPasswordStrong = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^(){}[\]:;<>,.?/~_+\-=|\\]).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Merci de remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      Alert.alert('Erreur', 'Mot de passe trop faible.');
      return;
    }
    if (!accessToken) {
      Alert.alert('Erreur', 'Token de réinitialisation manquant.');
      return;
    }

    try {
      setLoading(true);
      // Mettre à jour le mot de passe avec le token
      const { error } = await supabase.auth.api
        .updateUser(accessToken, { password: newPassword });
      setLoading(false);

      if (error) {
        Alert.alert('Erreur', error.message);
      } else {
        Alert.alert('Succès', 'Mot de passe modifié avec succès.');
        navigation.navigate('LoginScreen');
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <TextInput
        style={styles.input}
        placeholder="Nouveau mot de passe"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'Valider'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight:'bold', marginBottom:20, color:'black' },
  input: { borderBottomWidth:1, borderBottomColor:'black', marginBottom:20, padding:10, color:'black' },
  button: { backgroundColor:'green', padding:15, borderRadius:8, alignItems:'center' },
  buttonText: { color:'white', fontWeight:'bold', fontSize:18 },
});
