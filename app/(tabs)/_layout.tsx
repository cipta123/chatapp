import { Link, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, View } from 'react-native';
import NotificationBadge from '../../components/NotificationBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const wsConnection = new WebSocket('ws://localhost:8080');
      setWs(wsConnection);

      wsConnection.onopen = () => {
        console.log('WebSocket connected in layout');
        wsConnection.send(JSON.stringify({
          type: 'register',
          userId
        }));
      };

      wsConnection.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('WebSocket message in layout:', data);

        switch (data.type) {
          case 'pending_requests_count':
            setPendingRequests(data.count);
            break;
          case 'new_friend_request':
            setPendingRequests(prev => prev + 1);
            break;
        }
      };

      wsConnection.onerror = (e) => {
        console.error('WebSocket error:', e);
      };

      wsConnection.onclose = () => {
        console.log('WebSocket closed in layout');
        // Try to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => (
            <View>
              <FontAwesome name="user-plus" size={24} color={color} />
              <NotificationBadge count={pendingRequests} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
