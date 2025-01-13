import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/LoginApp/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username, // This is the NIM
          password  // This is the birthday
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Login successful
        router.replace('/(tabs)');
      } else {
        // Login failed
        Alert.alert('Login Failed', data.message || 'Invalid NIM or birthday');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <TextInput
          style={styles.input}
          placeholder="NIM Mahasiswa"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Birthday (YYYY-MM-DD)"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loginBox: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
