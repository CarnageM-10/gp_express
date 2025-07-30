import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function LivraisonListScreenGP() {
  const navigation = useNavigation();
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState('fr');
  const { themeMode } = useTheme();
  const isDarkMode = themeMode === 'dark';

  const colors = {
    background: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#E0DADA',
    cardBackground: isDarkMode ? '#2A2A2A' : '#fff',
    badgeGreen: '#4CAF50',
  };

  const styles = createStyles(colors);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return userLanguage === 'fr' ? `${day}/${month}/${year}` : `${year}/${month}/${day}`;
  };

  const getRelativeDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor(
      (date.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    );

    if (diff === 0) return userLanguage === 'fr' ? 'Aujourd’hui' : 'Today';
    if (diff === 1) return userLanguage === 'fr' ? 'Demain' : 'Tomorrow';
    if (diff === -1) return userLanguage === 'fr' ? 'Hier' : 'Yesterday';
    if (diff > 1 && diff <= 3)
      return userLanguage === 'fr' ? `Dans ${diff} jours` : `In ${diff} days`;
    if (diff < -1 && diff >= -3)
      return userLanguage === 'fr' ? `Il y a ${Math.abs(diff)} jours` : `${Math.abs(diff)} days ago`;

    return formatDate(dateStr);
  };

  useEffect(() => {
    const fetchLivraisons = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Erreur récupération user:', userError);
        setLoading(false);
        return;
      }

      // 🔽 Récupérer la langue depuis le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('language')
        .eq('auth_id', user.id)
        .single();

      if (profileError) {
        console.error('Erreur profil:', profileError);
      } else if (profile?.language) {
        setUserLanguage(profile.language);
      }

      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          client_auth_id,
          delivery_requests (
            id,
            nom_prenom,
            adresse_livraison,
            numero_suivi,
            status,
            annonce_id,
            annonces (
              ville_depart,
              ville_arrivee,
              date_depart,
              date_arrivee
            )
          )
        `)
        .eq('gp_auth_id', user.id);

      if (error) {
        console.error('Erreur récupération livraisons:', error);
      } else {
        const filtered = data.filter(chat =>
          chat.delivery_requests?.status === 'acceptee' ||
          chat.delivery_requests?.status === 'livree'
        );
        setLivraisons(filtered);
      }

      setLoading(false);
    };

    fetchLivraisons();
  }, []);

  if (loading) {
    return <Text style={{ marginTop: 20, textAlign: 'center', color: colors.text }}>Chargement...</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Navbar />
      <View style={styles.container}>
        <FlatList
          data={livraisons}
          keyExtractor={(item) => item.delivery_requests?.id?.toString()}
          renderItem={({ item }) => {
            const dr = item.delivery_requests;
            const status = dr?.status;
            const annonce = dr?.annonces;

            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('LivraisonDetail', {
                  id: dr.id,
                })}
              >
                <Text style={styles.nom}>{dr.nom_prenom}</Text>
                <Text style={styles.adresse}>{dr.adresse_livraison}</Text>
                <Text style={styles.suivi}>{dr.numero_suivi}</Text>

                <Text style={styles.villeInfo}>
                  {annonce?.ville_depart} → {annonce?.ville_arrivee}
                </Text>

                <Text style={styles.villeInfo}>
                  {userLanguage === 'fr' ? 'Départ' : 'Departure'} : {formatDate(annonce?.date_depart)} | {userLanguage === 'fr' ? 'Arrivée' : 'Arrival'} : {formatDate(annonce?.date_arrivee)}
                </Text>

                {status === 'livree' && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {userLanguage === 'fr' ? 'Livré' : 'Delivered'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
      <Sidebar language={userLanguage} />
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    item: {
      backgroundColor: colors.cardBackground,
      padding: 16,
      marginBottom: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    nom: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    adresse: {
      fontSize: 14,
      color: colors.text,
      marginTop: 4,
    },
    suivi: {
      fontSize: 13,
      color: colors.text,
      marginTop: 4,
    },
    villeInfo: {
      fontSize: 12,
      color: colors.text,
      marginTop: 8,
      fontStyle: 'italic',
    },
    badgeContainer: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: colors.badgeGreen,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
  });
