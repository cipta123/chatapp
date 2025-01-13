import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.nim}>NIM: 12345</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="user" size={20} color="#666" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="bell" size={20} color="#666" />
          <Text style={styles.menuText}>Notifications</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="lock" size={20} color="#666" />
          <Text style={styles.menuText}>Privacy</Text>
          <FontAwesome name="chevron-right" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <Link href="/login" asChild>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    router.navigate('/login');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nim: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
