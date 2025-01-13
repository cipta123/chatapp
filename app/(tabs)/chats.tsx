import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Conversation = {
  id: number;
  participants: string;
  last_message: string;
  last_message_time: string;
  other_participant_name: string;
};

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`http://localhost/LoginApp/api/messages.php?student_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      } else {
        console.error('Failed to load conversations:', data.error);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubText}>Add friends to start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Link href={`/chat/${item.id}`} asChild>
              <TouchableOpacity style={styles.chatItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.other_participant_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{item.other_participant_name}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.last_message || 'No messages yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/add-friend')}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    color: 'white',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
});
