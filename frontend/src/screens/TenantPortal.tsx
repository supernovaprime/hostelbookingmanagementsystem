import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type TenantPortalNavigationProp = StackNavigationProp<RootStackParamList, 'TenantPortal'>;

interface Props {
  navigation: TenantPortalNavigationProp;
}

const TenantPortal: React.FC<Props> = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => navigation.navigate('Home') }
      ]
    );
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tenant Portal</Text>
      <Text style={styles.subtitle}>Manage your bookings and preferences</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Browse Hostels</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>My Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.tertiaryButton]}>
        <Text style={[styles.buttonText, styles.tertiaryButtonText]}>Payment History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Profile Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.tertiaryButton]}>
        <Text style={[styles.buttonText, styles.tertiaryButtonText]}>Support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF8C00', // Orange primary
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#007AFF', // Blue secondary
  },
  secondaryButtonText: {
    color: '#fff',
  },
  tertiaryButton: {
    backgroundColor: '#00CED1', // Cyan tertiary
  },
  tertiaryButtonText: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TenantPortal;
