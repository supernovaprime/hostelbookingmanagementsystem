import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Hostel Booking</Text>
      <Text style={styles.subtitle}>Find and book hostels easily</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('TenantPortal')}>
        <Text style={styles.buttonText}>Browse Hostels</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('SuperAdminPortal')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Super Admin Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.tertiaryButton]} onPress={() => navigation.navigate('ManagerPortal')}>
        <Text style={[styles.buttonText, styles.tertiaryButtonText]}>Manager Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('TenantPortal')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Tenant Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '80%',
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
});

export default HomeScreen;
