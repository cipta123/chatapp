import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  count: number;
};

export default function NotificationBadge({ count }: Props) {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
