import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { translate } from '../translations'; // Import de ta fonction translate

const Sidebar = ({ language }) => {
  const navigation = useNavigation();
  const { theme, themeMode } = useTheme();
  const styles = makeStyles(theme, themeMode);

  return (
    <View style={styles.sidebarWrapper}>
      <View style={styles.sidebar}>
        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('AnnonceDetail')}
        >
          <Image
            source={require('../assets/truck.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Annonces', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Suivi')}
        >
          <Image
            source={require('../assets/fast-delivery.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Suivi livraison', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Messages')}
        >
          <Image
            source={require('../assets/chat.png')}
            style={styles.sidebarIcon}
          />
          <Text style={styles.sidebarText}>{translate('Messages', language)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image
            source={require('../assets/user.png')}
            style={styles.sidebarIconProfil}
          />
          <Text style={styles.sidebarText}>{translate('Profil', language)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (theme, themeMode) =>
  StyleSheet.create({
    sidebarWrapper: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 13,
      borderTopRightRadius: 13,
      borderWidth: 1,
      borderColor: theme.colors.separator,
      overflow: 'hidden',
    },
    sidebar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
    },
    sidebarItem: {
      alignItems: 'center',
    },
    sidebarIcon: {
      width: 32,
      height: 32,
      tintColor: themeMode === 'dark' ? theme.colors.icon : undefined,
    },
    sidebarIconProfil: {
      width: 38,
      height: 38,
    },
    sidebarText: {
      fontSize: 14,
      marginTop: 4,
      color: theme.colors.text,
    },
  });

export default Sidebar;
