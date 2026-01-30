import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AnimatedHostelIcon from '../src/components/animations/AnimatedHostelIcon';
import FloatingElements from '../src/components/animations/FloatingElements';
import PulseButton from '../src/components/animations/PulseButton';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FloatingElements />
        <View style={styles.loadingTextContainer}>
          <AnimatedHostelIcon size={100} color="#FF8C00" delay={500} />
          <Text style={styles.loadingTitle}>HostelHub</Text>
          <Text style={styles.loadingSubtitle}>Your perfect stay awaits...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <FloatingElements />

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome to HostelHub</Text>
          <Text style={styles.subtitle}>Find and book amazing hostels worldwide</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>Secure</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureText}>Rated</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureText}>Affordable</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <PulseButton
            title="Login"
            onPress={() => router.push('/login')}
            style={styles.primaryButton}
            pulseColor="#FF8C00"
          />
          <PulseButton
            title="Register"
            onPress={() => router.push('/register')}
            style={styles.secondaryButton}
            pulseColor="#007AFF"
          />
          <PulseButton
            title="Browse as Guest"
            onPress={() => router.push('/tenant')}
            style={styles.tertiaryButton}
            pulseColor="#00CED1"
          />
        </View>
      </View>
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 10,
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#FF8C00',
    top: height * 0.1,
    left: width * 0.1,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#007AFF',
    top: height * 0.3,
    right: width * 0.1,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#00CED1',
    bottom: height * 0.2,
    left: width * 0.2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
    marginBottom: 15,
  },
  tertiaryButton: {
    backgroundColor: '#00CED1',
    marginBottom: 15,
  },
});
