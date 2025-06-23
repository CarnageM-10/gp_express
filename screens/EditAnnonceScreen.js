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
    if (annonceId && annonceUserId) {
      const fetchAnnonce = async () => {
        setIsLoading(true);
        console.log('🔄 Chargement des données pour l’annonce', annonceId, annonceUserId);

        const { data, error } = await supabase
          .from('annonces')
          .select('*')
          .eq('id', annonceId)
          .eq('user_id', annonceUserId)
          .single();

        if (error) {
          console.error('❌ Erreur chargement annonce :', error);
          Alert.alert('Erreur', 'Impossible de charger l’annonce: ' + error.message);
          navigation.goBack();
        } else if (data) {
          console.log('✅ Données récupérées :', data);

          setNomPrenom(data.nom_prenom || '');
          setDateDepart(formatDateToDisplay(data.date_depart));
          setDateArrivee(formatDateToDisplay(data.date_arrivee));
          setVilleDepart(data.ville_depart || '');
          setVilleArrivee(data.ville_arrivee || '');
          setDateLimiteDepot(formatDateToDisplay(data.date_limite_depot));
          setAdressePays(data.adresse_pays || '');
          setAdresseVille(data.adresse_ville || '');
          setAdresseRue(data.adresse_rue || '');
          setPoids(data.poids_max_kg?.toString() || '');
          setPrice(data.prix_valeur?.toString() || '');
          setSelectedDevise(data.prix_devise || 'CFA');

          // 🔍 Vérification de la mise à jour des états
          console.log('🎯 États mis à jour :', {
            nomPrenom,
            dateDepart,
            dateArrivee,
            villeDepart,
            villeArrivee,
            dateLimiteDepot,
            adressePays,
            adresseVille,
            adresseRue,
            poids,
            price,
            selectedDevise,
          });
        }

        setIsLoading(false);
      };

      fetchAnnonce();
    }
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left.png')} style={styles.leftIcon} />
        </TouchableOpacity>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Image source={require('../assets/gp_image.png')} style={styles.gp_image} />
      </View>
      <View style={styles.container}>
      {/* Header fixe */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Modifier l'annonce</Text>
        <View style={styles.headerBar} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

  {/* Nom et prénom */}
  <View style={{ marginBottom: 20 }}>
    <Text style={styles.label}>Nom et Prénom</Text>
    <TextInput
      value={nomPrenom}
      onChangeText={setNomPrenom}
      style={styles.input}
      placeholder="Nom et Prénom"
      placeholderTextColor="#999"
    />
  </View>

  {/* Ligne Date départ / Date arrivée */}
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Date de départ</Text>
        <TouchableOpacity onPress={() => setShowDatePickerDepart(true)}>
          <TextInput
            editable={false}
            value={dateDepart}
            style={styles.inputGrayRect}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#999"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Date d’arrivée</Text>
        <TouchableOpacity onPress={() => setShowDatePickerArrivee(true)}>
          <TextInput
            editable={false}
            value={dateArrivee}
            style={styles.inputGrayRect}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor="#999"
          />
        </TouchableOpacity>
      </View>
  </View>

  {/* Ligne Ville départ / Ville arrivée */}
  
  <View style={styles.row}>
    <View style={styles.column}>
      <Text style={styles.label}>Ville de départ</Text>
      <TextInput
        value={villeDepart}
        onChangeText={setVilleDepart}
        style={styles.inputGrayRect}
        placeholder="Ville de départ"
        placeholderTextColor="#999"
      />
    </View>
    <View style={styles.column}>
      <Text style={styles.label}>Ville d’arrivée</Text>
      <TextInput
        value={villeArrivee}
        onChangeText={setVilleArrivee}
        style={styles.inputGrayRect}
        placeholder="Ville d’arrivée"
        placeholderTextColor="#999"
      />
    </View>
  </View>

    {/* Date limite de dépôt */}
    <Text style={styles.label}>Date limite de dépôt</Text>
    <TouchableOpacity onPress={() => setShowDatePickerLimite(true)}>
      <TextInput
        editable={false}
        value={dateLimiteDepot}
        style={styles.input}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor="#999"
      />
    </TouchableOpacity>

    {/* Adresse : Pays / Ville / Rue (en colonne) */}
    <View style={styles.rowpvr}>
  <View style={styles.field}>
    <Text style={styles.label}>Pays</Text>
    <TextInput
      value={adressePays}
      onChangeText={setAdressePays}
      style={styles.input}
      placeholder="Pays"
      placeholderTextColor="#999"
    />
  </View>

  <View style={styles.field}>
    <Text style={styles.label}>Ville</Text>
    <TextInput
      value={adresseVille}
      onChangeText={setAdresseVille}
      style={styles.input}
      placeholder="Ville"
      placeholderTextColor="#999"
    />
  </View>

  <View style={styles.field}>
    <Text style={styles.label}>Rue</Text>
    <TextInput
      value={adresseRue}
      onChangeText={setAdresseRue}
      style={styles.input}
      placeholder="Rue"
      placeholderTextColor="#999"
    />
  </View>
</View>


    {/* Poids max kg */}
    <Text style={styles.label}>Poids maximum (kg)</Text>
    <TextInput
      value={poids}
      onChangeText={setPoids}
      style={styles.input}
      placeholder="0-10kg"
      placeholderTextColor="#999"
    />

    {/* Ligne Prix / Devise avec rectangle arrondi et séparé par / */}
      <View style={{ padding: 20 }}>
      <Text style={styles.label}>Prix et Devise</Text>
      <View style={styles.rowPriceDevise}>
        <TextInput
          value={price}
          onChangeText={setPrice}
          style={styles.inputRounded}
          placeholder="Prix"
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
      <Text style={styles.buttonText}>Modifier</Text>
    </TouchableOpacity>

  </ScrollView>

    </View>

      {/* Barre de navigation bottom (sidebar) */}
      <View style={styles.sidebarWrapper}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Home')}>
            <Image source={require('../assets/truck.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Suivi')}>
            <Image source={require('../assets/fast-delivery.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Suivi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Messages')}>
            <Image source={require('../assets/notif.png')} style={styles.sidebarIcon} />
            <Text style={styles.sidebarText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sidebarItem} onPress={() => navigation.navigate('Profil')}>
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
