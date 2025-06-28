import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { translate } from '../translations'; 
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';


export default function EditAnnonceScreen(props) {
  const [nomPrenom, setNomPrenom] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [dateLimiteDepot, setDateLimiteDepot] = useState('');
  const [adressePays, setAdressePays] = useState('');
  const [adresseVille, setAdresseVille] = useState('');
  const [adresseRue, setAdresseRue] = useState('');
  const [poids, setPoids] = useState('');
  const [price, setPrice] = useState('');
  const [selectedDevise, setSelectedDevise] = useState('CFA');
  const [montantCFA, setMontantCFA] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePickerLimite, setShowDatePickerLimite] = useState(false);
  const [showDatePickerDepart, setShowDatePickerDepart] = useState(false);
  const [showDatePickerArrivee, setShowDatePickerArrivee] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { annonceId, annonceUserId } = route.params || {};
  const { language, changeLanguage  } = useLanguage();
  

  const conversionRates = {
    'CFA': 1,               // Franc CFA (XOF)
    'EUR': 1 / 655.957,      // Euro
    'USD': 1 / 600,          // Dollar américain (approx.)
    'GBP': 1 / 770,          // Livre sterling (approx.)
    'CAD': 1 / 450,          // Dollar canadien (approx.)
    'NGN': 1 / 1.3,          // Naira nigérian (approx.)
    'MAD': 1 / 66,           // Dirham marocain (approx.)
    'DZD': 1 / 45,           // Dinar algérien (approx.)
    'CNY': 1 / 85,           // Yuan chinois (approx.)
  };

  const onChangeDevise = (newDevise) => {
    if (price && !isNaN(price)) {
      // Convertir le prix actuel en CFA
      const priceInCFA = parseFloat(price) / conversionRates[selectedDevise];

      // Convertir ce montant CFA dans la nouvelle devise
      const newPrice = (priceInCFA * conversionRates[newDevise]).toFixed(2);

      setPrice(newPrice.toString());
    }
    setSelectedDevise(newDevise);
  };

  const formatDateToDisplay = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    const day = ('0' + d.getDate()).slice(-2);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      try {
        // 🔑 Récupération de l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log('❌ Erreur récupération utilisateur :', userError?.message);
          setIsLoading(false);
          return;
        }

        // 🌐 Récupération de la langue
        const { data: langData, error: langError } = await supabase
          .from('profiles')
          .select('language')
          .eq('auth_id', user.id)
          .single();

        if (langError) {
          console.log('❌ Erreur récupération langue :', langError.message);
        } else if (langData?.language) {
          changeLanguage(langData.language);
        }

        // 📦 Récupération de l’annonce si les IDs sont valides
        if (annonceId && annonceUserId) {
          console.log('🔄 Chargement des données pour l’annonce', annonceId, annonceUserId);

          const { data: annonceData, error: annonceError } = await supabase
            .from('annonces')
            .select('*')
            .eq('id', annonceId)
            .eq('user_id', annonceUserId)
            .single();

          if (annonceError) {
            console.error('❌ Erreur chargement annonce :', annonceError);
            Alert.alert('Erreur', 'Impossible de charger l’annonce: ' + annonceError.message);
            navigation.goBack();
          } else if (annonceData) {
            console.log('✅ Données récupérées :', annonceData);

            setNomPrenom(annonceData.nom_prenom || '');
            setDateDepart(formatDateToDisplay(annonceData.date_depart));
            setDateArrivee(formatDateToDisplay(annonceData.date_arrivee));
            setVilleDepart(annonceData.ville_depart || '');
            setVilleArrivee(annonceData.ville_arrivee || '');
            setDateLimiteDepot(formatDateToDisplay(annonceData.date_limite_depot));
            setAdressePays(annonceData.adresse_pays || '');
            setAdresseVille(annonceData.adresse_ville || '');
            setAdresseRue(annonceData.adresse_rue || '');
            setPoids(annonceData.poids_max_kg?.toString() || '');
            setPrice(annonceData.prix_valeur?.toString() || '');
            setSelectedDevise(annonceData.prix_devise || 'CFA');
          }
        }
      } catch (err) {
        console.error('❌ Erreur inattendue :', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [annonceId, annonceUserId]);


  const handleUpdate = async () => {
    if (
      !nomPrenom.trim() || !dateDepart.trim() || !dateArrivee.trim() ||
      !villeDepart.trim() || !villeArrivee.trim() || !dateLimiteDepot.trim() ||
      !adressePays.trim() || !adresseVille.trim() || !adresseRue.trim() ||
      !poids.trim() || !price.trim()
    ) {
      Alert.alert('Erreur', '⚠️ Tous les champs sont obligatoires.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || user.id !== annonceUserId) {
      Alert.alert('Erreur', 'Utilisateur non autorisé à modifier cette annonce');
      return;
    }

    const toISODate = (dateStr) => {
      const [dd, mm, yyyy] = dateStr.split('/');
      return `${yyyy}-${mm}-${dd}`;
    };

    const updateData = {
      nom_prenom: nomPrenom,
      date_depart: toISODate(dateDepart),
      date_arrivee: toISODate(dateArrivee),
      ville_depart: villeDepart,
      ville_arrivee: villeArrivee,
      date_limite_depot: toISODate(dateLimiteDepot),
      adresse_pays: adressePays,
      adresse_ville: adresseVille,
      adresse_rue: adresseRue,
      poids_max_kg: parseFloat(poids),
      prix_valeur: parseFloat(price),
      prix_devise: selectedDevise,
    };

    console.log('📤 Données envoyées pour update :', updateData);

    const { error } = await supabase
      .from('annonces')
      .update(updateData)
      .eq('id', annonceId)
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Annonce mise à jour avec succès !');
      navigation.navigate('Annonce');

    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement de l’annonce...</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}        
      <Navbar/>
      <View style={styles.container}>
      {/* Header fixe */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{translate("Modifier l'annonce", language)}</Text>
        <View style={styles.headerBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

  {/* Nom et prénom */}
  <View style={{ marginBottom: 20 }}>
    <Text style={styles.label}>{translate('Nom & Prénom', language)}</Text>
    <TextInput
      value={nomPrenom}
      onChangeText={setNomPrenom}
      style={styles.input}
      placeholder={translate('Nom & Prénom', language)}
      placeholderTextColor="#999"
    />
  </View>

  {/* Ligne Date départ / Date arrivée */}
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>{translate('Date de départ', language)}</Text>
        <TouchableOpacity onPress={() => setShowDatePickerDepart(true)}>
          <TextInput
            editable={false}
            value={dateDepart}
            style={styles.inputGrayRect}
            placeholder={translate("JJ/MM/AAAA", language)}
            placeholderTextColor="#999"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>{translate('Date d’arrivée', language)}</Text>
        <TouchableOpacity onPress={() => setShowDatePickerArrivee(true)}>
          <TextInput
            editable={false}
            value={dateArrivee}
            style={styles.inputGrayRect}
            placeholder={translate("JJ/MM/AAAA", language)}
            placeholderTextColor="#999"
          />
        </TouchableOpacity>
      </View>
  </View>

  {/* Ligne Ville départ / Ville arrivée */}
  
  <View style={styles.row}>
    <View style={styles.column}>
      <Text style={styles.label}>{translate('Ville de départ', language)}</Text>
      <TextInput
        value={villeDepart}
        onChangeText={setVilleDepart}
        style={styles.inputGrayRect}
        placeholder={translate("Ville de départ", language)}
        placeholderTextColor="#999"
      />
    </View>
    <View style={styles.column}>
      <Text style={styles.label}>{translate("Ville d’arrivée", language)}</Text>
      <TextInput
        value={villeArrivee}
        onChangeText={setVilleArrivee}
        style={styles.inputGrayRect}
        placeholder={translate("Ville d’arrivée", language)}
        placeholderTextColor="#999"
      />
    </View>
  </View>

    {/* Date limite de dépôt */}
    <Text style={styles.label}>{translate('Date limite de dépôt', language)}</Text>
    <TouchableOpacity onPress={() => setShowDatePickerLimite(true)}>
      <TextInput
        editable={false}
        value={dateLimiteDepot}
        style={styles.input}
        placeholder={translate("JJ/MM/AAAA", language)}
        placeholderTextColor="#999"
      />
    </TouchableOpacity>

    {/* Adresse : Pays / Ville / Rue (en colonne) */}
    <View style={styles.rowpvr}>
  <View style={styles.field}>
    <Text style={styles.label}>{translate('Pays', language)}</Text>
    <TextInput
      value={adressePays}
      onChangeText={setAdressePays}
      style={styles.input}
      placeholder={translate("Pays", language)}
      placeholderTextColor="#999"
    />
  </View>

  <View style={styles.field}>
    <Text style={styles.label}>{translate('Ville', language)}</Text>
    <TextInput
      value={adresseVille}
      onChangeText={setAdresseVille}
      style={styles.input}
      placeholder={translate("Ville", language)}
      placeholderTextColor="#999"
    />
  </View>

  <View style={styles.field}>
    <Text style={styles.label}>{translate('Rue', language)}</Text>
    <TextInput
      value={adresseRue}
      onChangeText={setAdresseRue}
      style={styles.input}
      placeholder={translate("Rue", language)}
      placeholderTextColor="#999"
    />
  </View>
</View>


    {/* Poids max kg */}
    <Text style={styles.label}>{translate('Poids maximum (kg)', language)}</Text>
    <TextInput
      value={poids}
      onChangeText={setPoids}
      style={styles.input}
      placeholder="0-10kg"
      placeholderTextColor="#999"
    />

    {/* Ligne Prix / Devise avec rectangle arrondi et séparé par / */}
      <View style={{ padding: 20 }}>
      <Text style={styles.label}>{translate('Prix et Devise', language)}</Text>
      <View style={styles.rowPriceDevise}>
        <TextInput
          value={price}
          onChangeText={setPrice}
          style={styles.inputRounded}
          placeholder={translate("Prix", language)}
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        <Text style={{ alignSelf: 'center', marginHorizontal: 6 }}>/</Text>
        <View style={styles.pickerWrapperRounded}>
          <Picker
            selectedValue={selectedDevise}
            onValueChange={onChangeDevise}
            style={{ height: 50, marginBottom: 15, width: 120 }}
          >
            {Object.keys(conversionRates).map(dev => (
              <Picker.Item key={dev} label={dev} value={dev} />
            ))}
          </Picker>
        </View>
      </View>
      {showDatePickerDepart && (
      <DateTimePicker
        value={new Date()}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          setShowDatePickerDepart(Platform.OS === 'ios');
          if (selectedDate) {
            const day = ('0' + selectedDate.getDate()).slice(-2);
            const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
            const year = selectedDate.getFullYear();
            setDateDepart(`${day}/${month}/${year}`);
          }
        }}
      />
    )}

    {showDatePickerArrivee && (
      <DateTimePicker
        value={new Date()}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          setShowDatePickerArrivee(Platform.OS === 'ios');
          if (selectedDate) {
            const day = ('0' + selectedDate.getDate()).slice(-2);
            const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
            const year = selectedDate.getFullYear();
            setDateArrivee(`${day}/${month}/${year}`);
          }
        }}
      />
    )}

    {showDatePickerLimite && (
      <DateTimePicker
        value={new Date()}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          setShowDatePickerLimite(Platform.OS === 'ios');
          if (selectedDate) {
            const day = ('0' + selectedDate.getDate()).slice(-2);
            const month = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
            const year = selectedDate.getFullYear();
            setDateLimiteDepot(`${day}/${month}/${year}`);
          }
        }}
      />
    )}

    </View>


    <TouchableOpacity style={styles.button} onPress={handleUpdate}>
      <Text style={styles.buttonText}>{translate('Modifier', language)}</Text>
    </TouchableOpacity>

  </ScrollView>
  
  </View>
  
  <Sidebar language={language} />
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
    paddingTop: 28, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  leftIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  logo: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
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
  gp_image: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4095A4',
  },
  headerBar: {
    height: 4,
    backgroundColor: '#4095A4',
    marginTop: 6,
    borderRadius: 2,
    width: 100, // tu peux ajuster
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 20,
    fontSize: 16,
    color: '#111',
  },
  pickerWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    marginBottom: 30,
  },
  picker: {
    height: 45,
    color: '#111',
  },
  button: {
    backgroundColor: '#4095A4',
    paddingVertical: 14,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
    rowPriceDevise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },

  inputRounded: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#000',
  },

  pickerWrapperRounded: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 40,
  },

  pickerRounded: {
    height: 40,
    color: '#000',
    backgroundColor: '#fff',
  },


  row: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputGrayRect: {
    backgroundColor: '#EFF1F2',
    borderRadius: 5,          
    borderWidth: 1,
    borderColor: '#999',
    height: 40,
    paddingHorizontal: 10,
    color: '#000',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#999',
    height: 40,
    paddingHorizontal: 10,
    color: '#000',
  },
  rowpvr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  field: {
    flex: 1,               
    marginHorizontal: 5,   
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,     
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  rowPriceDevise: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRounded: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  pickerWrapperRounded: {
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    overflow: 'hidden',
  },

});
