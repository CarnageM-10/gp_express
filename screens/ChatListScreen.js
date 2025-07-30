// ChatListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, changeLanguage } = useLanguage();
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';

  const colors = {
    background: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#E0DADA',
    inputBackground: isDarkMode ? '#333' : '#EFF1F2',
    cardBackground: isDarkMode ? '#2A2A2A' : '#fff',
    subtleText: isDarkMode ? '#999' : '#C7CECF',
  };

  const styles = createStyles(colors);

  useEffect(() => {
    const fetchChats = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Erreur récupération user:', userError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          status,
          client_auth_id,
          delivery_requests (
            id,
            nom_prenom,
            colis_name,
            adresse_livraison,
            ville_arrivee,
            numero_suivi
          )
        `)
        .eq('gp_auth_id', user.id);

      if (error) {
        console.error('Erreur récupération chats:', error);
      } else {
        setChats(data);
      }
      setLoading(false);
    };

    fetchChats();
  }, []);

  if (loading) {
    return <Text style={[styles.loading, { color: colors.text }]}>Chargement...</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <View style={styles.container}>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={async () => {
                // 🔄 Requête Supabase pour récupérer les infos *actualisées* de delivery_requests
                const { data: latestDeliveryRequest, error } = await supabase
                  .from('delivery_requests')
                  .select('*')
                  .eq('id', item.delivery_requests.id)
                  .single();

                if (error) {
                  console.error("Erreur de récupération des données actualisées:", error);
                  return;
                }

                navigation.navigate('ChatDetail', {
                  chatId: item.id,
                  deliveryRequest: latestDeliveryRequest,
                  clientId: item.client_auth_id,
                });
              }}
            >
              <Text style={styles.chatName}>{item.delivery_requests.nom_prenom}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <Sidebar language={language} />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    chatItem: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      marginVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chatName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    status: {
      fontSize: 14,
      color: colors.subtleText,
      marginTop: 4,
    },
    loading: {
      marginTop: 20,
      textAlign: 'center',
      fontSize: 16,
    },
  });
