import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Switch,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  Button
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const ProfileScreen = () => {
  const [profile, setProfile] = useState({});
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const data = await fetchProfileData();
      if (data) setProfile(data);
    };
    loadProfile();
  }, []);

  const toggleNotifications = async () => {
    const updated = { ...profile, notifications_enabled: !profile.notifications_enabled };
    setProfile(updated);
    await updateProfileData({ notifications_enabled: updated.notifications_enabled });
  };

  const toggleMessages = async (value) => {
    const updated = { ...profile, messages_enabled: value };
    setProfile(updated);
    await updateProfileData({ messages_enabled: value });
  };

  const changeTheme = async (value) => {
    const updated = { ...profile, theme: value };
    setProfile(updated);
    await updateProfileData({ theme: value });
  };

  const changeLanguage = async (value) => {
    const updated = { ...profile, language: value };
    setProfile(updated);
    await updateProfileData({ language: value });
  };

  const fetchProfileData = async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      console.error('Erreur fetch profile:', profileError.message);
      return null;
    }

    return profile;
  };

  const updateProfileData = async (updates) => {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', user.id);

    if (updateError) {
      console.error('Erreur update profile:', updateError.message);
    }
  };

return (
  <View style={styles.screen}>
    <Navbar />
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Bloc profil + options */}
      <View style={styles.container}>
        <View style={styles.topBlock}>
          <Image source={require('../assets/user.png')} style={styles.profileImage} />
          <View style={styles.infoBlock}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.row}>
          <Image source={require('../assets/people.png')} style={styles.icon} />
          <Text style={styles.label}>Mon profil</Text>
          <Image source={require('../assets/chevron.png')} style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.row}>
          <Image source={require('../assets/chat.png')} style={styles.icon} />
          <Text style={styles.label}>Notifications</Text>
          <Switch value={profile.notifications_enabled} onValueChange={toggleNotifications} />
        </View>

        {/* Messages */}
        <View style={styles.row}>
          <Image source={require('../assets/notif.png')} style={styles.icon} />
          <Text style={styles.label}>Messages</Text>
          <TouchableOpacity onPress={() => setShowMessageOptions(true)}>
            <Text style={styles.toggleTextinput}>{profile.messages_enabled ? 'Activé' : 'Désactivé'}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showMessageOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMessageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Gérer les messages</Text>

              <Pressable
                onPress={() => {
                  toggleMessages(true);
                  setShowMessageOptions(false);
                }}
              >
                <Text style={styles.modalOption}>Activer</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  toggleMessages(false);
                  setShowMessageOptions(false);
                }}
              >
                <Text style={styles.modalOption}>Désactiver</Text>
              </Pressable>

              <Pressable onPress={() => setShowMessageOptions(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Thème */}
        <View style={styles.row}>
          <Image source={require('../assets/theme.png')} style={styles.icon} />
          <Text style={styles.label}>Thème</Text>
          <TouchableOpacity onPress={() => setShowThemeOptions(true)}>
            <Image source={require('../assets/down-arrow.png')} style={styles.chevron} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showThemeOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir le thème</Text>

              <Pressable
                onPress={() => {
                  changeTheme('light');
                  setShowThemeOptions(false);
                }}
              >
                <Text style={styles.modalOption}>Light</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  changeTheme('dark');
                  setShowThemeOptions(false);
                }}
              >
                <Text style={styles.modalOption}>Dark</Text>
              </Pressable>

              <Pressable onPress={() => setShowThemeOptions(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Langue */}
        <View style={styles.row}>
          <Image source={require('../assets/langue.png')} style={styles.icon} />
          <Text style={styles.label}>Langue ({profile.language === 'fr' ? 'FR' : 'EN'})</Text>
          <TouchableOpacity onPress={() => setShowLanguageOptions(true)}>
            <Image source={require('../assets/down-arrow.png')} style={styles.chevron} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showLanguageOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguageOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choisir la langue</Text>

              <Pressable
                onPress={() => {
                  changeLanguage('fr');
                  setShowLanguageOptions(false);
                }}
              >
                <Text style={styles.modalOption}>🇫🇷 Français</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  changeLanguage('en');
                  setShowLanguageOptions(false);
                }}
              >
                <Text style={styles.modalOption}>🇬🇧 English</Text>
              </Pressable>

              <Pressable onPress={() => setShowLanguageOptions(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>

      {/* Support & Information */}
      <View style={styles.container}>
        <View style={styles.downBlock}>
          <TouchableOpacity style={styles.row}>
            <Image source={require('../assets/support.png')} style={styles.icon} />
            <Text style={styles.label}>Support & Information</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.row}>
          <Image source={require('../assets/sup_client.png')} style={styles.icon} />
          <Text style={styles.label}>Centre d'aide</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Image source={require('../assets/compliant.png')} style={styles.icon} />
          <Text style={styles.label}>Mentions Légales</Text>
        </View>
      </View>
    </ScrollView>

    <View style={styles.sidebarContainer}>
      <Sidebar />
    </View>
  </View>
);

};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    position: 'relative',
  },
  scrollContainer: {
    paddingBottom: 0,
  },
  container: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 17,
    borderRadius: 7,
    elevation: 3,
  },
  downBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoBlock: {
    marginLeft: 15,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  email: {
    color: 'gray',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 15,
    width: '110%', 
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  chevron: {
    width: 16,
    height: 16,
  },
  toggleText: {
    color: 'blue',
  },
  optionBox: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  sidebarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    },
    modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    },
    modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
    },
    modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    width: '100%',
    textAlign: 'center',
    },
    modalCancel: {
    marginTop: 15,
    color: '#C41F16',
    fontSize: 16,
    textAlign: 'center',
    },
    toggleTextinput: {
    color: '#6D6C6C',
    }
});

export default ProfileScreen;
