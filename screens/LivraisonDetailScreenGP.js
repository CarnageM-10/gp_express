import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export function LivraisonDetailScreenGP({ route }) {
  const { id } = route.params;
  const [request, setRequest] = useState(null);
  const [annonce, setAnnonce] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [selectedEtape, setSelectedEtape] = useState(null);
  const [lastStep, setLastStep] = useState(null);

  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const t = {
    fr: {
      loading: 'Chargement...',
      date: '🕓 Livré le',
      poids: 'Poids',
      prix: 'Prix',
      enregistrer: 'Enregistrer',
      modifier: 'Modifier',
    },
    en: {
      loading: 'Loading...',
      date: '🕓 Delivered on',
      poids: 'Weight',
      prix: 'Price',
      enregistrer: 'Save',
      modifier: 'Edit',
    },
  }[language];

  useEffect(() => {
    loadThemeFromProfile();
    fetchDetails();
  }, []);

  const loadThemeFromProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('theme')
      .eq('auth_id', user.id)
      .single();

    if (profile?.theme && (profile.theme === 'dark' || profile.theme === 'light')) {
      setTheme(profile.theme);
    }
  };

  const fetchDetails = async () => {
    const { data: reqData } = await supabase
      .from('delivery_requests')
      .select('*')
      .eq('id', id)
      .single();
    setRequest(reqData);

    const { data: annData } = await supabase
      .from('annonces')
      .select('*')
      .eq('id', reqData.annonce_id)
      .single();
    setAnnonce(annData);

    const { data: etapeData } = await supabase
      .from('livraison_etapes')
      .select('*')
      .eq('delivery_request_id', id)
      .order('create_at', { ascending: true });

    setEtapes(etapeData || []);
    if (etapeData?.length) {
      setLastStep(etapeData[etapeData.length - 1]);
    }
  };

  const currentEtapeIndex = etapes.length;

  const etapesList = [
    { key: 'colis récupéré', label: 'Colis récupéré' },
    { key: 'vérification du colis', label: 'Vérification du colis' },
    { key: 'paiement effectué', label: 'Paiement effectué' },
    { key: 'livraison en cours', label: 'Livraison en cours' },
    { key: 'livraison effectué', label: 'Livraison effectué' },
  ];

    const saveEtape = async () => {
      if (!selectedEtape) return;

      // Blocage si "vérification du colis" sans validation de "colis récupéré"
      if (
        selectedEtape === 'vérification du colis' &&
        !etapes.find(e => e.etape === 'colis récupéré')?.validation
      ) {
        Alert.alert(
          'Action bloquée',
          'Vous devez passer par l’agence GP Express pour vérifier votre colis.'
        );
        return;
      }

      const status = selectedEtape === 'livraison effectué' ? 'livree' : 'en_cours';

      const payload = {
        delivery_request_id: id,
        etape: selectedEtape,
        status,
        create_at: new Date().toISOString(),
      };

      // On initialise la validation à false seulement pour la première étape
      if (selectedEtape === 'colis récupéré') {
        payload.validation = false;
      }

      await supabase.from('livraison_etapes').insert(payload);

      if (selectedEtape === 'livraison effectué') {
        await supabase
          .from('delivery_requests')
          .update({ status: 'livree' })
          .eq('id', id);
      }

      setSelectedEtape(null);
      fetchDetails();
    };

  if (!request || !annonce) {
    return <Text style={{ padding: 20 }}>{t.loading}</Text>;
  }

  const isDark = theme === 'dark';
  const textColor = isDark ? '#fff' : '#000';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#fff' }}>
      <Navbar />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Image source={require('../assets/profil.png')} style={styles.profileImageLeft} />
              <Text style={[styles.label, { color: textColor, marginLeft: 12, fontSize: 16 }]}>
                Nom du destinataire : {request.nom_prenom}
              </Text>
            </View>

            <Text style={[styles.label, { color: textColor, marginBottom: 10 }]}>
              Adresse de livraison : {'\n'}{request.adresse_livraison}
            </Text>

            <Text style={[styles.label, { color: textColor, marginBottom: 14 }]}>
              Numéro du colis : {'\n'}{request.numero_suivi}
            </Text>

            <View style={styles.separator} />

            <Text style={[styles.label, { color: textColor }]}>
              Colis : {request.colis_name}
            </Text>
            <Text style={[styles.label, { color: textColor }]}>
              {t.poids} : {annonce.poids_max_kg} kg
            </Text>
            <Text style={[styles.label, { color: textColor }]}>
              {t.prix} : {annonce.prix_valeur} {annonce.prix_devise}
            </Text>
          </View>

          <Text style={[styles.stepLabel, { color: textColor }]}>État de la livraison</Text>
          <View style={styles.etapesListContainer}>
            {etapesList.map((etape, index) => {
              const isDone = currentEtapeIndex > index;
              const isSelected = selectedEtape === etape.key;

              return (
                <TouchableOpacity
                  key={etape.key}
                  style={styles.etapeItem}
                  onPress={() => {
                    if (index === currentEtapeIndex) setSelectedEtape(etape.key);
                  }}
                >
                  <View
                    style={[
                      styles.etapeCircle,
                      isDone && styles.etapeDone,
                      isSelected && styles.etapeSelected,
                    ]}
                  />
                  <Text style={[styles.etapeLabel, { color: textColor }]}>
                    {etape.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedEtape && (
            <TouchableOpacity onPress={saveEtape} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>
                {etapes.length === 4 ? t.modifier : t.enregistrer}
              </Text>
            </TouchableOpacity>
          )}

          {etapes.length === 5 && lastStep?.etape === 'livraison effectué' && (
            <Text style={{ marginTop: 10, color: isDark ? '#90ee90' : '#006400' }}>
              {t.date} {new Date(lastStep.create_at).toLocaleString()}
            </Text>
          )}
        </ScrollView>
      </View>
      <Sidebar language={language} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    position: 'relative',
  },
  profileImageLeft: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  stepLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  etapesListContainer: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 16,
  },
  etapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  etapeLabel: {
    fontSize: 16,
  },
  etapeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#555',
    backgroundColor: 'transparent',
  },
  etapeDone: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  etapeSelected: {
    borderColor: '#2196f3',
    backgroundColor: '#2196f3',
  },
  saveButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
