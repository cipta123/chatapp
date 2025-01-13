import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddFriendScreen() {
  const [nim, setNim] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      const userName = await AsyncStorage.getItem('userName');
      
      const response = await fetch('http://localhost/LoginApp/api/send_friend_request.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          receiverNim: nim
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send WebSocket notification
        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'friend_request',
            senderId: userId,
            senderName: userName,
            receiverNim: nim
          }));
          ws.close();
        };

        Alert.alert('Success', 'Friend request sent successfully');
        router.back();
      } else {
        Alert.alert('Error', data.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Add Friend</Text>
        <Text style={styles.subtitle}>Enter your friend's Student ID (NIM)</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter NIM"
          value={nim}
          onChangeText={setNim}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSendRequest}
          disabled={loading || !nim}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
