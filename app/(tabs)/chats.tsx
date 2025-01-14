import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Conversation = {
  id: number;
  participants: string;
  last_message: string;
  last_message_time: string;
  other_participant_name: string;
  unread_count: number;
  created_at: string;
};

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadConversations();
    connectWebSocket();

    // Add AppState listener for background/foreground transitions
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Reconnect WebSocket when app comes to foreground
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
        // Reload conversations
        loadConversations();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      subscription.remove();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log('Connecting to WebSocket...');
      const ws = new WebSocket('ws://localhost:8080');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected in chats');
        ws.send(JSON.stringify({
          type: 'register',
          userId
        }));
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('WebSocket message in chats:', data);

        if (data.type === 'conversation_update') {
          setConversations(prevConversations => {
            // First, check if this conversation exists
            const conversationExists = prevConversations.some(
              conv => conv.id === data.conversation_id
            );

            let updatedConversations = prevConversations;

            if (!conversationExists) {
              // If conversation doesn't exist, reload all conversations
              loadConversations();
              return prevConversations;
            }

            // Update existing conversation
            updatedConversations = prevConversations.map(conv => {
              if (conv.id === data.conversation_id) {
                return {
                  ...conv,
                  last_message: data.last_message.text,
                  last_message_time: data.last_message.created_at,
                  unread_count: data.unread_count
                };
              }
              return conv;
            });

            // Sort conversations by latest message
            return updatedConversations.sort((a, b) => 
              new Date(b.last_message_time || b.created_at).getTime() - 
              new Date(a.last_message_time || a.created_at).getTime()
            );
          });
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error in chats:', e);
      };

      ws.onclose = (e) => {
        console.log('WebSocket closed in chats. Code:', e.code, 'Reason:', e.reason);
        // Try to reconnect after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 5000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      console.log('Loading conversations...');
      const response = await fetch(`http://localhost/LoginApp/api/messages.php?student_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter out any duplicate conversations and ensure they have unique IDs
        const uniqueConversations = data.conversations.reduce((acc: Conversation[], curr: Conversation) => {
          const exists = acc.find(conv => conv.id === curr.id);
          if (!exists) {
            acc.push(curr);
          }
          return acc;
        }, []);

        // Sort conversations by latest message time
        const sortedConversations = uniqueConversations.sort((a: Conversation, b: Conversation) => 
          new Date(b.last_message_time || b.created_at).getTime() - 
          new Date(a.last_message_time || a.created_at).getTime()
        );

        console.log('Conversations loaded:', sortedConversations.length);
        setConversations(sortedConversations);
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

  const handleConversationPress = async (conversationId: number) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // Mark conversation as read
      fetch('http://localhost/LoginApp/api/messages.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: userId,
          mark_read: true
        })
      });

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );

      // Navigate to chat
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
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
            <TouchableOpacity 
              style={styles.chatItem}
              onPress={() => handleConversationPress(item.id)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.other_participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{item.other_participant_name}</Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.lastMessageContainer}>
                  <Text style={[
                    styles.lastMessage, 
                    item.unread_count > 0 && styles.unreadMessage
                  ]} numberOfLines={1}>
                    {item.last_message || 'No messages yet'}
                  </Text>
                  {item.last_message_time && (
                    <Text style={[
                      styles.messageTime,
                      item.unread_count > 0 && styles.unreadMessageTime
                    ]}>
                      {formatTime(item.last_message_time)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#000',
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadMessageTime: {
    color: '#007AFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
