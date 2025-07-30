import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  ImageBackground,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';


export default function ChatDetailScreen({ route, navigation }) {
  const { chatId, deliveryRequest } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAccepted, setIsAccepted] = useState(false);
  const [userId, setUserId] = useState(null);
  const { language } = useLanguage();
  const { themeMode } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const flatListRef = React.useRef(null);


  const isDarkMode = themeMode === 'dark';

  const colors = {
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#E0DADA',
    inputBackground: isDarkMode ? '#333' : '#EFF1F2',
    subtleText: isDarkMode ? '#999' : '#C7CECF',
  };

  const styles = createStyles(colors);

  const handleDeleteChat = async () => {
    await supabase.from('chats').delete().eq('id', chatId);
    navigation.navigate('ChatListScreen');
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.setHours(0,0,0,0) - date.setHours(0,0,0,0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return null; // même jour pas de séparateur
    if (diffDays === 1) return 'Hier';
    if (diffDays === 2) return 'Avant-hier';
    
    return date.toLocaleDateString(); // format local pour dates plus anciennes
  };


  useEffect(() => {
    let mounted = true;
    let channel;

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted && user) {
        setUserId(user.id);
      }

      fetchMessages();

      channel = supabase
        .channel(`chat-messages-channel-${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    };

    init();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('create_at', { ascending: true });

    if (!error && data) setMessages(data);
    else console.error('Erreur récupération messages:', error);
  };

  const handleAccept = async () => {
    try {
      // 1. Mettre à jour le statut de la demande et du chat
      await supabase
        .from('delivery_requests')
        .update({ status: 'acceptee' })
        .eq('id', deliveryRequest.id);

      await supabase
        .from('chats')
        .update({ status: 'acceptee' })
        .eq('id', chatId);

      // 2. Message de confirmation avec le numéro de suivi
      const numeroSuivi = deliveryRequest.numero_suivi;

      if (numeroSuivi) {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            chat_id: chatId,
            sender_auth_id: userId,
            delivery_request_id: deliveryRequest.id,
            confirmation_livraison: `✅ Votre demande a été acceptée avec succès. Le numéro de suivi de votre colis est : ${numeroSuivi}`,
          })
          .select(); // on récupère le message inséré

        if (error) {
          console.error('Erreur insertion message de confirmation:', error);
        } else if (data && data.length > 0) {
          setMessages((prev) => [...prev, data[0]]); // ajout immédiat au chat
        }
      }

      setIsAccepted(true);
    } catch (error) {
      console.error('Erreur lors de l’acceptation :', error);
    }
  };


  const handleRefuse = async () => {
    await supabase
      .from('delivery_requests')
      .update({ status: 'refusee' })
      .eq('id', deliveryRequest.id);

    await supabase
      .from('chats')
      .update({ status: 'refusee' })
      .eq('id', chatId);

    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_auth_id: userId,
      delivery_request_id: deliveryRequest.id,
      confirmation_livraison: 'Votre demande a été refusée.',
    });

    setShowDeleteConfirm(true);
  };

  const sendMessage = async () => {
    if (message.trim() === '' || !userId) return;

    const newMsg = {
      id: Math.random().toString(), // temporaire, clé unique locale
      chat_id: chatId,
      sender_auth_id: userId,
      delivery_request_id: deliveryRequest.id,
      content: message,
      create_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]); // Ajout immédiat

    setMessage('');

    const { data, error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_auth_id: userId,
      delivery_request_id: deliveryRequest.id,
      content: message,
    }).select();

    if (error) {
      console.error('Erreur envoi message:', error);
      // Optionnel: retirer le message local ou afficher erreur
    } else if (data && data.length > 0) {
      // Remplacer le message temporaire par celui du serveur (avec ID réel)
      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== newMsg.id);
        return [...filtered, data[0]];
      });
    }
  };


  const predefinedMessage = `Le client ${deliveryRequest.nom_prenom} vous demande de livrer le colis "${deliveryRequest.colis_name}" à "${deliveryRequest.adresse_livraison}" dans la ville de "${deliveryRequest.ville_arrivee}". Acceptez-vous ?`;

const renderItem = ({ item }) => {
  const isUserMessage = item.sender_auth_id === userId;
  const messageTime = new Date(item.create_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isConfirmation = item.confirmation_livraison && item.confirmation_livraison.trim() !== '';

  return (
    <View
      style={[
        isConfirmation ? styles.predefinedBubbleInfos : styles.bubble,
        isUserMessage ? styles.gp : styles.client,
      ]}
    >
      <Text
        style={[
          isConfirmation ? styles.bubbleText : (isUserMessage ? styles.bubbleText : styles.clientText),
        ]}
      >
        {item.confirmation_livraison || item.content || ''}
      </Text>

      <Text style={{ fontSize: 10, color: colors.subtleText, marginTop: 4, alignSelf: 'flex-end' }}>
        {messageTime}
      </Text>
    </View>
  );
};

  return (
  <>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <Navbar />
          <ImageBackground
            source={require('../assets/ecran.png')}
            style={styles.background}
            resizeMode="cover"
          >
            <View style={styles.header}>
              <Text style={[styles.headerText, { color: colors.text }]}>
                {deliveryRequest.nom_prenom}
              </Text>
            </View>

            <View style={styles.container}>
              {!showDeleteConfirm ? (
                <>
                  <View style={styles.predefinedBubble}>
                    <Text style={[styles.bubbleText, { color: colors.text }]}>
                      {predefinedMessage}
                    </Text>

                    {(deliveryRequest.status !== 'acceptee' &&
                      deliveryRequest.status !== 'refusee' &&
                      !isAccepted) && (
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[
                            styles.acceptBtn,
                            (isAccepted || deliveryRequest.status === 'acceptee') && { opacity: 0.5 },
                          ]}
                          disabled={isAccepted || deliveryRequest.status === 'acceptee'}
                          onPress={handleAccept}
                        >
                          <Text style={styles.btnText}>Accepter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.refuseBtn,
                            (isAccepted || deliveryRequest.status === 'acceptee') && { opacity: 0.5 },
                          ]}
                          disabled={isAccepted || deliveryRequest.status === 'acceptee'}
                          onPress={handleRefuse}
                        >
                          <Text style={styles.btnText}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {deliveryRequest.status === 'refusee' && (
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={[styles.refuseBtn, { opacity: 0.5 }]} disabled>
                        <Text style={styles.btnText}>Refusé</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={renderItem}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ref={flatListRef}
                  />

                  {(deliveryRequest.status === 'acceptee' || isAccepted) && (
                    <View style={styles.messageRow}>
                      <TextInput
                        style={styles.inputAlone}
                        placeholder="Message..."
                        placeholderTextColor="#2d2c2cff"
                        value={message}
                        onChangeText={setMessage}
                      />
                      <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                        <Image source={require('../assets/send.png')} style={styles.sendIcon} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.confirmDeleteContainer}>
                  <Text style={[styles.bubbleText, { marginBottom: 10, color: colors.text }]}>
                    Voulez-vous supprimer ce chat ?
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={handleDeleteChat}>
                      <Text style={styles.btnText}>Oui</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refuseBtn} onPress={handleCancelDelete}>
                      <Text style={styles.btnText}>Non</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>

    {/* Sidebar en dehors du KeyboardAvoidingView */}
    <Sidebar language={language} />
  </>
);
}

const createStyles = (colors) => 
  StyleSheet.create({
    background: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 12,
      paddingBottom: 60,
    },
    header: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: '#007AFF',
    },
    headerText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    message: {
      fontSize: 16,
      marginBottom: 20,
      color: colors.text,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    acceptBtn: {
      backgroundColor: 'green',
      padding: 10,
      borderRadius: 10,
    },
    refuseBtn: {
      backgroundColor: 'red',
      padding: 10,
      borderRadius: 10,
    },
    btnText: {
      color: 'white',
      fontWeight: 'bold',
    },

    // ✅ Barre de message propre et arrondie
    messageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FAE6E6',
      borderRadius: 30,
      paddingHorizontal: 10,
      marginVertical: 10,
      marginHorizontal: 15,
    },

    // ✅ Barre d'input sans bordure droite, à gauche
    inputAlone: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 15,
      fontSize: 16,
      color: '#1C1C1C',
    },

    // ✅ Bouton à droite, non collé, pas de style circulaire
    sendBtn: {
      padding: 8,
      marginLeft: 10,
      backgroundColor: 'transparent', // pas de fond
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendIcon: {
      width: 22,
      height: 22,
      resizeMode: 'contain',
    },

    bubble: {
      padding: 12,
      marginVertical: 6,
      marginHorizontal: 8,
      borderRadius: 20,
      maxWidth: '75%',
    },
    gp: {
      backgroundColor: '#E7D8D8',
      alignSelf: 'flex-end',
      borderBottomRightRadius: 0,
    },
    client: {
      backgroundColor: '#c87373ff',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 0,
    },
    bubbleText: {
      color: '#4c4f4cff',
      fontSize: 16,
    },
    predefinedBubble: {
      backgroundColor: '#009fdeff',
      padding: 12,
      borderRadius: 20,
      marginBottom: 20,
      alignSelf: 'flex-start',
      marginHorizontal: 8,
      maxWidth: '85%',
      borderBottomLeftRadius: 0,
    },
    predefinedBubbleInfos: {
      padding: 12,
      borderRadius: 20,
      marginBottom: 20,
      alignSelf: 'flex-start',
      marginHorizontal: 8,
      maxWidth: '85%',
      borderBottomRightRadius: 0,
    },
    confirmDeleteContainer: {
      backgroundColor: '#E7D8D8',
      padding: 12,
      borderRadius: 20,
      marginBottom: 20,
      alignSelf: 'center',
      marginHorizontal: 8,
      maxWidth: '85%',
      borderBottomLeftRadius: 0,
    },
    timeText: {
      fontSize: 10,
      color: '#999',
      marginTop: 4,
      alignSelf: 'flex-end',
    },

  });
