// components/Sidebar.js
import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Sidebar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.sidebarWrapper}>
      <View style={styles.sidebar}>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('AnnonceDetail')}>
          <Image source={require('../assets/truck.png')} style={styles.sidebarIcon} />
          <Text style={styles.sidebarText}>Annonces</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Suivi')}>
          <Image source={require('../assets/fast-delivery.png')} style={styles.sidebarIcon} />
          <Text style={styles.sidebarText}>Suivi livraison</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Messages')}>
          <Image source={require('../assets/chat.png')} style={styles.sidebarIcon} />
          <Text style={styles.sidebarText}>Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Profile')}>
          <Image source={require('../assets/user.png')} style={styles.sidebarIconProfil} />
          <Text style={styles.sidebarText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarWrapper: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(15, 15, 15, 0.2)',
    overflow: 'hidden',
  },
  sidebar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  sidebarItem: {
    alignItems: 'center',
  },
  sidebarIcon: {
    width: 32,
    height: 32,
  },
  sidebarIconProfil: {
    width: 38,
    height: 38,
  },
  sidebarText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default Sidebar;
