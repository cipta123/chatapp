import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

type FriendRequest = {
  request_id: string;
  sender_id: string;
  sender_name: string;
  sender_nim: string;
  created_at: string;
  status: string;
};

type SentRequest = {
  request_id: string;
  receiver_id: string;
  receiver_name: string;
  receiver_nim: string;
  created_at: string;
  status: string;
};

export default function RequestsScreen() {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    loadUserData();
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  };

  const loadUserData = async () => {
    try {
      const userIdValue = await AsyncStorage.getItem('userId');
      setUserId(userIdValue);
      if (userIdValue) {
        fetchRequests(userIdValue);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchRequests = async (currentUserId: string) => {
    try {
      const response = await fetch(`http://localhost/LoginApp/api/get_friend_requests.php?userId=${currentUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setReceivedRequests(data.received);
        setSentRequests(data.sent);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load friend requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResponse = async (requestId: string, response: 'accepted' | 'rejected', index: number) => {
    try {
      // Start slide out animation
      const itemSlideAnim = new Animated.Value(0);
      Animated.timing(itemSlideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const result = await fetch('http://localhost/LoginApp/api/respond_friend_request.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          response,
          userId
        }),
      });

      const data = await result.json();
      
      if (data.success) {
        // Remove request from list
        setReceivedRequests(prev => prev.filter(req => req.request_id !== requestId));

        if (response === 'accepted') {
          Alert.alert(
            'Friend Request Accepted! 🎉',
            'You can now start chatting with your new friend.',
            [
              {
                text: 'Start Chat',
                onPress: () => router.push(`/chat/${data.conversationId}`),
                style: 'default'
              },
              {
                text: 'Maybe Later',
                style: 'cancel'
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  const renderReceivedRequest = ({ item, index }: { item: FriendRequest; index: number }) => (
    <Animated.View 
      style={[
        styles.requestCard,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50 * index]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.sender_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{item.sender_name}</Text>
            <Text style={styles.userNim}>NIM: {item.sender_nim}</Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleResponse(item.request_id, 'accepted', index)}
        >
          <FontAwesome name="check" size={20} color="#fff" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleResponse(item.request_id, 'rejected', index)}
        >
          <FontAwesome name="times" size={20} color="#fff" />
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSentRequest = ({ item, index }: { item: SentRequest; index: number }) => (
    <Animated.View 
      style={[
        styles.requestCard,
        styles.sentRequest,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50 * index]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatarContainer, styles.sentAvatar]}>
            <Text style={styles.avatarText}>
              {item.receiver_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{item.receiver_name}</Text>
            <Text style={styles.userNim}>NIM: {item.receiver_nim}</Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.pendingStatus}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.pendingText}>Waiting for response...</Text>
      </View>
    </Animated.View>
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (receivedRequests.length === 0 && sentRequests.length === 0) {
    return (
      <Animated.View 
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <FontAwesome name="user-plus" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>No Friend Requests</Text>
        <Text style={styles.emptySubtitle}>
          Start connecting with other students by adding them as friends!
        </Text>
        <TouchableOpacity 
          style={styles.addFriendButton}
          onPress={() => router.push('/add-friend')}
        >
          <FontAwesome name="plus" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.addFriendText}>Add New Friend</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      {receivedRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Received Requests</Text>
          <FlatList
            data={receivedRequests}
            renderItem={renderReceivedRequest}
            keyExtractor={item => item.request_id}
            contentContainerStyle={styles.requestsList}
          />
        </View>
      )}

      {sentRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sent Requests</Text>
          <FlatList
            data={sentRequests}
            renderItem={renderSentRequest}
            keyExtractor={item => item.request_id}
            contentContainerStyle={styles.requestsList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    color: '#2c3e50',
  },
  requestsList: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sentRequest: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sentAvatar: {
    backgroundColor: '#6c757d',
  },
  avatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userNim: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#adb5bd',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  pendingText: {
    color: '#6c757d',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  addFriendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
