import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AnnonceDetailScreen({ navigation }) {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnoncesByUser();
  }, []);

  const fetchAnnoncesByUser = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('annonces')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setAnnonces(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    Alert.alert(
        'Confirmation',
        "Es-tu sûr de vouloir supprimer cette annonce ?",
        [
        {
            text: 'Annuler',
            style: 'cancel',
        },
        {
            text: 'Supprimer',
            onPress: async () => {
            const { error } = await supabase.from('annonces').delete().eq('id', id);
            if (error) {
                Alert.alert('Erreur', error.message);
            } else {
                // 🔥 Supprime localement l'annonce immédiatement
                setAnnonces(prev => prev.filter(item => item.id !== id));

                Alert.alert('Succès', "L'annonce a bien été supprimée");
                
                // (optionnel) Re-fetch pour être sûr de la synchro avec Supabase
                // await fetchAnnoncesByUser();
            }
            },
        },
        ],
        { cancelable: true }
    );
    };


  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left.png')} style={styles.leftIcon} />
        </TouchableOpacity>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>

      {/* annonces */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {annonces.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Aucune annonce trouvée.</Text>
        ) : (
          annonces.map((annonce) => (
            <View key={annonce.id} style={styles.annonceCard}>
              <View style={styles.userHeader}>
                <Image source={require('../assets/userlogo.png')} style={styles.userLogo} />
                <Text style={styles.userName}>{annonce.nom_prenom}</Text>
              </View>

              <View style={styles.annonceContent}>
                {[
                  'ville_depart', 'ville_arrivee',
                  'date_depart', 'date_arrivee', 'date_limite_depot',
                  'poids_max_kg', 'prix_valeur', 'prix_devise'
                ].map(key => (
                  <View key={key} style={styles.row}>
                    <Text style={styles.label}>{key.replace(/_/g, ' ')} :</Text>
                    <Text style={styles.value}>{annonce[key]}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    navigation.navigate('EditAnnonce', {
                      annonceId: annonce.id,
                      annonceUserId: annonce.user_id,
                    })
                  }
                >
                  <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnText}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.deleteBtn]}
                  onPress={() => handleDelete(annonce.id)}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.btnText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* barre navigation bas */}
      <View style={styles.sidebarWrapper}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/truck.png')} style={styles.sidebarIcon}onPress={() => navigation.navigate('Annonce')} />
            <Text style={styles.sidebarText}>Accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/fast-delivery.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Suivi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem}>
            <Image source={require('../assets/notif.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem }onPress={() => navigation.navigate('Home')}>
            <Image source={require('../assets/user.png')} style={styles.sidebarIconProfil} />
            <Text style={styles.sidebarText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 28, // ✅ ajouté pour faire descendre le header
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  leftIcon: {
    width: 40,   // ✅ augmenté
    height: 40,  // ✅ augmenté
    resizeMode: 'contain',
  },
  logo: {
    width: 200,  // ✅ légèrement augmenté
    height: 60,  // ✅ légèrement augmenté
    resizeMode: 'contain',
  },

  scrollContainer: {
    padding: 16,
  },
  annonceCard: {
    backgroundColor: '#4095A4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  userName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  annonceContent: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#e0f7fa',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  value: {
    color: '#fff',
    fontWeight: '400',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editBtn: {
    backgroundColor: '#007bff',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
  },
  btnText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
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
  button: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#4D90FE',
  padding: 10,
  borderRadius: 5,
  },
});
