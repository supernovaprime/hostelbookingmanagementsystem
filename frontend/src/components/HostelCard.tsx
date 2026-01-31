import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

type HostelCardNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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

interface HostelCardProps {
  hostel: Hostel;
  navigation: HostelCardNavigationProp;
  index: number;
}

const HostelCard: React.FC<HostelCardProps> = ({ hostel, navigation, index }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tapGesture = Gesture.Tap()
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      runOnJS(() => {
        // Navigate to hostel details (we'll create this screen later)
        navigation.navigate('TenantPortal'); // Temporary navigation
      })();
    });

  const primaryImage = hostel.images.find(img => img.isPrimary) || hostel.images[0];

  const formatPrice = (price: number) => {
    return `GHS ${price.toLocaleString()}`;
  };

  const getRoomTypeDisplay = (type: string, capacity: number) => {
    const typeMap: { [key: string]: string } = {
      single: 'Single',
      double: 'Double',
      triple: 'Triple',
      dormitory: 'Dorm',
      private: 'Private',
      shared: 'Shared',
    };
    return `${typeMap[type] || type} (${capacity} ${capacity === 1 ? 'person' : 'people'})`;
  };

  return (
    <GestureDetector gesture={tapGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage.url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>🏠</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {hostel.rating.average.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({hostel.rating.count})</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.hostelName} numberOfLines={1}>
            {hostel.name}
          </Text>

          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {hostel.address.city}, {hostel.address.state}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {hostel.shortDescription}
          </Text>

          <View style={styles.roomsContainer}>
            <Text style={styles.roomsTitle}>Available Rooms:</Text>
            {hostel.availableRooms.slice(0, 3).map((room, roomIndex) => (
              <View key={room._id} style={styles.roomItem}>
                <Text style={styles.roomType}>
                  {getRoomTypeDisplay(room.type, room.capacity)}
                </Text>
                <Text style={styles.roomPrice}>
                  {formatPrice(room.price.baseAmount)}
                </Text>
              </View>
            ))}
            {hostel.availableRooms.length > 3 && (
              <Text style={styles.moreRooms}>
                +{hostel.availableRooms.length - 3} more rooms
              </Text>
            )}
          </View>

          <View style={styles.priceRange}>
            <Text style={styles.priceRangeText}>
              From {formatPrice(hostel.minPrice)} - {formatPrice(hostel.maxPrice)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#ccc',
  },
  overlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  hostelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  roomsContainer: {
    marginBottom: 12,
  },
  roomsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  roomType: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8C00',
  },
  moreRooms: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  priceRange: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    textAlign: 'center',
  },
});

export default HostelCard;
