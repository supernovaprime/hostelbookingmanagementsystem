import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import AnimatedHostelIcon from '../components/animations/AnimatedHostelIcon';
import FloatingElements from '../components/animations/FloatingElements';
import PulseButton from '../components/animations/PulseButton';
import HostelCard from '../components/HostelCard';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface Hostel {
  _id: string;
  name: string;
  shortDescription: string;
  address: {
    city: string;
    state: string;
  };
  images: Array<{ url: string; isPrimary: boolean }>;
  rating: {
    average: number;
    count: number;
  };
  availableRooms: Array<{
    _id: string;
    type: string;
    capacity: number;
    price: {
      baseAmount: number;
      currency: string;
    };
  }>;
  minPrice: number;
  maxPrice: number;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loadingHostels, setLoadingHostels] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchHostels();
    }
  }, [isLoading]);

  const fetchHostels = async () => {
    try {
      setLoadingHostels(true);
      const response = await fetch(`${API_BASE_URL}/hostels?availableOnly=true&limit=6`);
      const data = await response.json();

      if (response.ok) {
        setHostels(data.hostels || []);
      }
    } catch (error) {
      console.error('Error fetching hostels:', error);
    } finally {
      setLoadingHostels(false);
    }
  };

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
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
              onPress={() => navigation.navigate('Login')}
              style={styles.primaryButton}
              pulseColor="#FF8C00"
            />
            <PulseButton
              title="Register"
              onPress={() => navigation.navigate('Register')}
              style={styles.secondaryButton}
              pulseColor="#007AFF"
            />
            <PulseButton
              title="Browse as Guest"
              onPress={() => navigation.navigate('TenantPortal')}
              style={styles.tertiaryButton}
              pulseColor="#00CED1"
            />
          </View>
        </View>
      </LinearGradient>

      {/* Available Hostels Section */}
      <View style={styles.hostelsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏠 Available Hostels</Text>
          <Text style={styles.sectionSubtitle}>Choose from our best-rated hostels with vacant rooms</Text>
        </View>

        {loadingHostels ? (
          <View style={styles.loadingHostels}>
            <ActivityIndicator size="large" color="#FF8C00" />
            <Text style={styles.loadingText}>Finding amazing hostels...</Text>
          </View>
        ) : hostels.length > 0 ? (
          <FlatList
            data={hostels}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <HostelCard
                hostel={item}
                navigation={navigation}
                index={index}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.hostelsList}
          />
        ) : (
          <View style={styles.noHostels}>
            <Text style={styles.noHostelsIcon}>🏨</Text>
            <Text style={styles.noHostelsTitle}>No hostels available</Text>
            <Text style={styles.noHostelsText}>
              We're working to bring you the best hostels. Check back soon!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#f0f0f0',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hostelsSection: {
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  sectionHeader: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  loadingHostels: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  hostelsList: {
    paddingBottom: 20,
  },
  noHostels: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noHostelsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noHostelsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noHostelsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HomeScreen;
