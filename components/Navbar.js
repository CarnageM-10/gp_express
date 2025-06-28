import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const navigation = useNavigation();
  const { theme, themeMode } = useTheme();
  const styles = makeStyles(theme, themeMode);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Annonce')}>
        <Image
          source={require('../assets/left.png')}
          style={styles.leftIcon}
        />
      </TouchableOpacity>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
    </View>
  );
};

const makeStyles = (theme, themeMode) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: 28,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.separator,
    },
    leftIcon: {
      width: 40,
      height: 40,
      resizeMode: 'contain',
      tintColor: themeMode === 'dark' ? theme.colors.icon : undefined,
    },
    logo: {
      width: 200,
      height: 60,
      resizeMode: 'contain',
    },
  });

export default Navbar;
