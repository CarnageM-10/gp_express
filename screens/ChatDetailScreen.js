import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ImageBackground,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function ChatDetailScreen({ route }) {
  const { chatId, deliveryRequest } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAccepted, setIsAccepted] = useState(false);
  const [userId, setUserId] = useState(null);
  const { language } = useLanguage();
  const { themeMode } = useTheme();

  const isDarkMode = themeMode === 'dark';

  const colors = {
    text: isDarkMode ? '#fff' : '#000',
    border: isDarkMode ? '#444' : '#E0DADA',
    inputBackground: isDarkMode ? '#333' : '#EFF1F2',
    subtleText: isDarkMode ? '#999' : '#C7CECF',
  };

  const styles = createStyles(colors);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted && user) setUserId(user.id);
    });

    fetchMessages();

    const channel = supabase
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

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
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
    await supabase
      .from('delivery_requests')
      .update({ status: 'acceptee' })
      .eq('id', deliveryRequest.id);

    await supabase
      .from('chats')
      .update({ status: 'acceptee' })
      .eq('id', chatId);

    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_auth_id: userId,
      delivery_request_id: deliveryRequest.id,
      content: 'Votre demande a été acceptée.',
    });

    setIsAccepted(true);
  };

  const handleRefuse = async () => {
    await supabase
      .from('delivery_requests')
      .update({ status: 'refusee' })
      .eq('id', deliveryRequest.id);

    await supabase.from('chats').delete().eq('id', chatId);
  };

  const sendMessage = async () => {
    if (message.trim() === '' || !userId) return;

    const { error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_auth_id: userId,
      delivery_request_id: deliveryRequest.id,
      content: message,
    });

    if (!error) setMessage('');
    else console.error('Erreur envoi message:', error);
  };

  const predefinedMessage = `Le client ${deliveryRequest.nom_prenom} vous demande de livrer le colis "${deliveryRequest.colis_name}" à "${deliveryRequest.adresse_livraison}" dans la ville de "${deliveryRequest.ville_arrivee}". Acceptez-vous ?`;

  return (
    <View style={{ flex: 1 }}>
      <Navbar />
      <ImageBackground
        source={require('../assets/ecran.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>{deliveryRequest.nom_prenom}</Text>
        </View>

        <View style={styles.container}>
          {!isAccepted ? (
            <>
              <View style={styles.predefinedBubble}>
                <Text style={styles.bubbleText}>{predefinedMessage}</Text>
              

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                  <Text style={styles.btnText}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refuseBtn} onPress={handleRefuse}>
                  <Text style={styles.btnText}>Refuser</Text>
                </TouchableOpacity>
              </View>
              </View>
            </>
          ) : (
            <>
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.bubble,
                      item.sender_auth_id === userId ? styles.gp : styles.client,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{item.content}</Text>
                  </View>
                )}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Message..."
                  placeholderTextColor={colors.subtleText}
                  value={message}
                  onChangeText={setMessage}
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                  <Text style={styles.btnText}>Envoyer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Sidebar language={language} />
      </ImageBackground>
    </View>
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
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.inputBackground,
    },
    input: {
      flex: 1,
      backgroundColor: '#fff',
      color: colors.text,
      padding: 12,
      borderRadius: 25,
      paddingHorizontal: 16,
    },
    sendBtn: {
      marginLeft: 8,
      backgroundColor: '#007AFF',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 25,
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
      backgroundColor: '#FEFCFC',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 0,
    },
    bubbleText: {
      color: '#000',
      fontSize: 16,
    },
    predefinedBubble: {
      backgroundColor: '#E7D8D8',
      padding: 12,
      borderRadius: 20,
      marginBottom: 20,
      alignSelf: 'flex-start',
      marginHorizontal: 8,
      maxWidth: '85%',
      borderBottomLeftRadius: 0,
    },

  });
