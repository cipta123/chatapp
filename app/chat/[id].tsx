import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Message = {
  id: string;
  text: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
};

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<{[key: string]: boolean}>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const flatListRef = useRef<FlatList>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadUserDataAndConnect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const loadUserDataAndConnect = async () => {
    try {
      const values = await AsyncStorage.multiGet(['userId', 'userName']);
      const userIdValue = values[0][1];
      const userNameValue = values[1][1];
      console.log('Current user:', { id: userIdValue, name: userNameValue });
      
      if (!userIdValue) {
        console.error('No user ID found in AsyncStorage');
        return;
      }

      setUserId(userIdValue);
      setUserName(userNameValue);
      connectWebSocket(userIdValue);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const connectWebSocket = (currentUserId: string) => {
    console.log('Connecting to WebSocket...', { currentUserId });
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, re-registering user');
      const registerMessage = {
        type: 'register',
        userId: currentUserId
      };
      wsRef.current.send(JSON.stringify(registerMessage));
      return;
    }

    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected, registering user:', currentUserId);
      setWsConnected(true);
      // Register user connection
      const registerMessage = {
        type: 'register',
        userId: currentUserId
      };
      console.log('Sending register message:', registerMessage);
      ws.send(JSON.stringify(registerMessage));
    };

    ws.onmessage = (e) => {
      console.log('WebSocket message received:', e.data);
      const data = JSON.parse(e.data);
      
      switch (data.type) {
        case 'register_confirm':
          console.log('Registration confirmed for user:', currentUserId);
          break;
          
        case 'new_message':
          console.log('New message received:', data.message);
          if (data.message.conversation_id.toString() === conversationId?.toString()) {
            // Check if message already exists to prevent duplicates
            setMessages(prev => {
              const messageExists = prev.some(m => 
                m.text === data.message.text && 
                m.sender_id === data.message.sender_id &&
                Math.abs(new Date(m.created_at).getTime() - new Date(data.message.created_at).getTime()) < 1000
              );
              if (messageExists) {
                return prev;
              }
              return [...prev, data.message];
            });
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
          break;
          
        case 'typing':
          if (data.conversationId.toString() === conversationId?.toString()) {
            setTyping(prev => ({
              ...prev,
              [data.userId]: true
            }));
            
            if (typingTimeoutRef.current[data.userId]) {
              clearTimeout(typingTimeoutRef.current[data.userId]);
            }
            
            typingTimeoutRef.current[data.userId] = setTimeout(() => {
              setTyping(prev => ({
                ...prev,
                [data.userId]: false
              }));
            }, 3000);
          }
          break;
      }
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, attempting to reconnect...');
      setWsConnected(false);
      // Try to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket(currentUserId);
      }, 3000);
    };
  };

  useEffect(() => {
    // Load existing messages
    fetchMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const response = await fetch(`http://localhost/LoginApp/api/messages.php?conversation_id=${conversationId}`);
      const data = await response.json();
      console.log('Fetched messages:', data);
      
      if (data.success) {
        setMessages(data.messages);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (message.trim().length === 0 || !wsRef.current || !userId || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message:', {
        messageEmpty: message.trim().length === 0,
        wsExists: !!wsRef.current,
        userId: !!userId,
        wsState: wsRef.current?.readyState
      });
      return;
    }

    const messageData = {
      type: 'message',
      conversationId: conversationId?.toString(),
      senderId: userId,
      message: message.trim()
    };

    console.log('Sending message:', messageData);

    // Clear input first
    const messageText = message.trim();
    setMessage('');

    // Send to server first
    try {
      wsRef.current.send(JSON.stringify(messageData));
    } catch (error) {
      console.error('Error sending message:', error);
      // If sending fails, add message optimistically
      const optimisticMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender_id: parseInt(userId),
        sender_name: userName || 'You',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticMessage]);
      // Attempt to reconnect if send fails
      connectWebSocket(userId);
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTyping = () => {
    if (!wsRef.current || !userId || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversationId: conversationId?.toString(),
        userId
      }));
    } catch (error) {
      console.error('Error sending typing notification:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    console.log('Rendering message:', item);
    const isMine = item.sender_id.toString() === userId;

    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
        {!isMine && <Text style={styles.sender}>{item.sender_name}</Text>}
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {!wsConnected && (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>Reconnecting...</Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      {Object.values(typing).some(Boolean) && (
        <Text style={styles.typingIndicator}>Someone is typing...</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !wsConnected && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={message.trim().length === 0 || !wsConnected}
        >
          <FontAwesome 
            name="send" 
            size={20} 
            color={message.trim().length === 0 || !wsConnected ? '#ccc' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    padding: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  connectionStatus: {
    backgroundColor: '#ffeb3b',
    padding: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: '#000',
    fontSize: 12,
  },
});
