import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function CreateAnnonceScreen() {
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
  const [errorMessage, setErrorMessage] = useState('');
  const [showDatePickerLimite, setShowDatePickerLimite] = useState(false);
  const [showDatePickerDepart, setShowDatePickerDepart] = useState(false);
  const [showDatePickerArrivee, setShowDatePickerArrivee] = useState(false); 
  const [pickerVisible, setPickerVisible] = useState(false);
  const navigation = useNavigation();


  const formatDate = (date) => {
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = `${d.getFullYear()}`.slice(-4);
    return `${day}/${month}/${year}`;
  };
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

  const convertAmount = (amount, fromDevise, toDevise) => {
    if (!conversionRates[fromDevise] || !conversionRates[toDevise]) return amount;
    const amountInFCFA = parseFloat(amount) / conversionRates[fromDevise];
    return amountInFCFA * conversionRates[toDevise];
  };



const handlePublish = async () => {
  if (
    !nomPrenom.trim() ||
    !dateDepart.trim() ||
    !dateArrivee.trim() ||
    !villeDepart.trim() ||
    !villeArrivee.trim() ||
    !dateLimiteDepot.trim() ||
    !adressePays.trim() ||
    !adresseVille.trim() ||
    !adresseRue.trim() ||
    !poids.trim() ||
    !price.trim()
  ) {
    setErrorMessage('⚠️ Tous les champs sont obligatoires.');
    return;
  }

  // Authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert('Erreur', 'Utilisateur non authentifié');
    return;
  }

  // Insertion dans Supabase
  const { error } = await supabase.from('annonces').insert({
    user_id: user.id,
    nom_prenom: nomPrenom,
    date_depart: dateDepart,
    date_arrivee: dateArrivee,
    ville_depart: villeDepart,
    ville_arrivee: villeArrivee,
    date_limite_depot: dateLimiteDepot,
    adresse_pays: adressePays,
    adresse_ville: adresseVille,
    adresse_rue: adresseRue,
    poids_max_kg: poids,
    prix_valeur: isNaN(parseFloat(price)) ? 0 : parseFloat(price),
    prix_devise: selectedDevise,
  });

  if (error) {
    Alert.alert('Erreur', error.message);
  } else {
    setErrorMessage(''); 
    Alert.alert('Succès', 'Annonce publiée avec succès !');
    setNomPrenom('');
    setDateDepart('');
    setDateArrivee('');
    setVilleDepart('');
    setVilleArrivee('');
    setDateLimiteDepot('');
    setAdressePays('');
    setAdresseVille('');
    setAdresseRue('');
    setPoids('');
    setPrice('');
    setSelectedDevise('CFA');

  }
};

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Navbar />
       <Image source={require('../assets/gp_image.png')} style={styles.gp_image} />

    <View style={styles.headerWrapper}>
      <Text style={styles.title}>Créer une annonce</Text>
      <View style={styles.titleUnderline} />
    </View>

  <ScrollView contentContainerStyle={styles.container}>
    {/* Ton formulaire */}
    <View style={[styles.formWrapper, { width: '100%' }]}>
      
      <Text style={styles.label}>Nom & Prénom</Text>
      <TextInput
        placeholder="Entrer votre nom & prénom"
        placeholderTextColor="#E0DADA"
        style={styles.lineInput}
        value={nomPrenom}
        onChangeText={setNomPrenom}
      />

      <View style={styles.rowGroup}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Date de départ</Text>
          <TouchableOpacity onPress={() => setShowDatePickerDepart(true)}>
            <TextInput
              placeholder="JJ/MM/AA"
              style={styles.boxInput}
              value={dateDepart}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePickerDepart && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePickerDepart(false);
                if (selectedDate) {
                  setDateDepart(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>

        <Text style={styles.separatordate}>/</Text>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Date d'arrivée</Text>
          <TouchableOpacity onPress={() => setShowDatePickerArrivee(true)}>
            <TextInput
              placeholder="JJ/MM/AA"
              style={styles.boxInput}
              value={dateArrivee}
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showDatePickerArrivee && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePickerArrivee(false);
                if (selectedDate) {
                  setDateArrivee(formatDate(selectedDate));
                }
              }}
            />
          )}
        </View>
      </View>

      <View style={styles.rowGrouptext}>
        <Text style={styles.label}>Ville de départ</Text>
        <Text style={styles.label}>Ville d'arrivée</Text>
      </View>

      <View style={styles.rowGroup}>
        <TextInput
          placeholder="Ville de départ"
          placeholderTextColor="#E0DADA"
          style={styles.lineInput}
          value={villeDepart}
          onChangeText={setVilleDepart}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          placeholder="Ville d'arrivée"
          placeholderTextColor="#E0DADA"
          style={styles.lineInput}
          value={villeArrivee}
          onChangeText={setVilleArrivee}
        />
      </View>

      <Text style={styles.label}>Date limite de dépôt</Text>
      <TouchableOpacity onPress={() => setShowDatePickerLimite(true)}>
        <TextInput
          placeholder="JJ/MM/AA"
          style={styles.boxInput}
          value={dateLimiteDepot}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      {showDatePickerLimite && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePickerLimite(false);
            if (selectedDate) {
              setDateLimiteDepot(formatDate(selectedDate));
            }
          }}
        />
      )}

      <Text style={styles.label}>Adresse</Text>
      <View style={styles.rowGroup}>
        <TextInput
          placeholder="Pays"
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adressePays}
          onChangeText={setAdressePays}
        />
        <TextInput
          placeholder="Ville"
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adresseVille}
          onChangeText={setAdresseVille}
        />
        <TextInput
          placeholder="Rue"
          placeholderTextColor="#E0DADA"
          style={styles.addressInput}
          value={adresseRue}
          onChangeText={setAdresseRue}
        />
      </View>

      <Text style={styles.label}>Poids & Prix</Text>
      <View style={styles.rowGroup}>
        <TextInput
          placeholder="0 - 100kg"
          placeholderTextColor="#E0DADA"
          style={styles.roundInputkg}
          value={poids}
          onChangeText={setPoids}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          placeholder="Prix"
          value={price !== '' && !isNaN(parseFloat(price)) ? parseFloat(price).toFixed(2) : ''}
          onChangeText={(text) => setPrice(text)}
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
        />


          <View style={styles.devise}>
            <Text style={styles.deviseText}>{selectedDevise}</Text>

            <Picker
              selectedValue={selectedDevise}
              onValueChange={(itemValue) => {
                const converted = convertAmount(price, selectedDevise, itemValue);
                setSelectedDevise(itemValue);
                setPrice(converted.toString());
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#000"
            >
              {Object.keys(conversionRates).map((dev) => (
                <Picker.Item label={dev} value={dev} key={dev} />
              ))}
            </Picker>
          </View>
        
      </View>

      <TouchableOpacity style={styles.publishButton} onPress={handlePublish}>
        <Text style={styles.publishText}>Publier</Text>
      </TouchableOpacity>

    </View>
  </ScrollView>


      {/* BARRE DE NAVIGATION BAS */}
      <Sidebar />
    </View>
  );
}

const styles = StyleSheet.create({
  formWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  container: {
    paddingBottom: 90,
    paddingHorizontal: 0,
  },

  titleUnderline: {
    height: 4,
    backgroundColor: '#520056',
    width: '120%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 6,
    paddingTop: 18,  
    borderBottomWidth: 0,
    position: 'relative',
    zIndex: 10,
    marginTop: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  label: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },

  lineInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#E0DADA',
    paddingVertical: 8,
    fontSize: 16,
  },
  boxInput: {
    backgroundColor: '#EFF1F2',
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    flex: 1,
  },
  rowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  rowGrouptext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 100,
    marginTop: 10,
  },
  separator: {
    marginHorizontal: 6,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#C7CECF',
  },
  separatordate: {
    marginHorizontal: 9,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#C7CECF',
    marginTop: 45,
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DADA',
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  roundInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DADA',
    borderRadius: 15,
    padding: 10,
    marginTop: 5,
    backgroundColor: '#fff',
  },

  roundInputkg: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DADA',
    borderRadius: 100,
    padding: 10,
    marginTop: 5,
    backgroundColor: '#fff',
  },

  publishButton: {
    backgroundColor: '#4095A4',
    paddingVertical: 12,
    paddingHorizontal: 70,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 30,
    alignSelf: 'center',
  },

  publishText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0DADA',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 5,
    backgroundColor: '#fff',
    fontSize: 14,
  },

  devise: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    width: 120,
  },
  deviseText: {
    fontSize: 10,
    color: '#000',
    flex: 1,
  },
  picker: {
    height: 40,
    width: 70,
  },
  pickerItem: {
    fontSize: 14,
    color: '#000',
  },
  gp_image: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },
});

