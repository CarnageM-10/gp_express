import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { translate } from '../translations';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

// ... imports (inchangés)

const EditProfileScreen = () => {
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';
  const [language, setLanguage] = useState('fr');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null);
  const [newValue, setNewValue] = useState('');

  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    card: isDarkMode ? '#1E1E1E' : '#F4F4F4',
    border: isDarkMode ? '#333' : '#DDD',
  };

  useEffect(() => {
    const loadData = async () => {
      const dataProfile = await fetchProfileData();
      if (dataProfile) {
        setProfile(dataProfile);
        setLanguage(dataProfile.language || 'fr');
      } else {
        setLanguage('fr');
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (error) return null;
    return data;
  };

  const handleEdit = (field) => {
    setEditField(field);
    setNewValue(profile[field] || '');
  };

  const handleSaveField = () => {
    setProfile({ ...profile, [editField]: newValue });
    setEditField(null);
    setNewValue('');
  };

    const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const updates = {
        name: profile.name,
        first_name: profile.first_name,
        number: profile.number,
        location: profile.location,
    };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('auth_id', user.id);

    if (error) {
        console.error('Erreur de mise à jour', error);
        showMessage({
        message: "Erreur lors de la mise à jour",
        description: error.message,
        type: "danger",
        });
    } 
    };


  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirmation',
      'Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                data: { session },
                error: sessionError,
              } = await supabase.auth.getSession();

              if (sessionError || !session?.user) {
                Alert.alert('Erreur', 'Utilisateur non connecté.');
                return;
              }

              const userId = session.user.id;

              const { error: deleteError } = await supabase.functions.invoke('delete-user', {
                body: { user_id: userId },
              });

              if (deleteError) {
                Alert.alert('Erreur', deleteError.message);
              } else {
                Alert.alert('✅ Succès', 'Ton compte a été supprimé.');
                navigation.navigate('Login');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur inconnue', 'Une erreur est survenue.');
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setProfile({ ...profile, avatar_url: result.assets[0].uri });
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

          {/* Profil */}
          <View style={styles.profileBlock}>
            <View>
              <Image
                source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/user.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                <Image source={require('../assets/edit.png')} style={styles.editIconImage} />
              </TouchableOpacity>
            </View>
            <View style={{ marginLeft: 20 }}>
              <Text style={[styles.name, { color: colors.text }]}>
                {profile.first_name} {profile.name}
              </Text>
              <Text style={[styles.email, { color: colors.text }]}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {[
            { label: translate('Nom', language), key: 'name' },
            { label: translate('Prenom', language), key: 'first_name' },
            { label: translate('Numero', language), key: 'number' },
            { label: translate('Location', language), key: 'location' },
          ].map(({ label, key }) => (
            <TouchableOpacity
              key={key}
              style={[styles.infoBlock, { backgroundColor: colors.card }]}
              onPress={() => handleEdit(key)}
            >
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{profile[key]}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Image source={require('../assets/delete.png')} style={{ width: 20, height: 20, marginRight: 6 }} />
              <Text style={styles.deleteButtonText}>{translate('Supprimer', language)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{translate('Enregistrer', language)}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Sidebar language={language} />
      </View>

      {/* Modal */}
      <Modal visible={!!editField} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {translate('Modifier', language)} {translate(editField, language)}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={newValue}
              onChangeText={setNewValue}
              placeholder={translate(editField, language)}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={handleSaveField}>
              <Text style={styles.saveButtonText}>{translate('Enregistrer', language)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  editIconImage: {
    width: 20,
    height: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  separator: {
    height: 1,
    marginVertical: 20,
    backgroundColor: '#ccc',
  },
  infoBlock: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 14,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default EditProfileScreen;
