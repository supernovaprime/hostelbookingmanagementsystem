import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type RoomSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RoomSelection'>;
type RoomSelectionScreenRouteProp = RouteProp<RootStackParamList, 'RoomSelection'>;

interface Props {
  navigation: RoomSelectionScreenNavigationProp;
  route: RoomSelectionScreenRouteProp;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  capacity: number;
  price: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  description: string;
  images: string[];
}

const RoomSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { hostelId, checkInDate, checkOutDate, numberOfGuests } = route.params;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        numberOfGuests: numberOfGuests.toString(),
      });

      const response = await fetch(
        `http://localhost:5000/api/bookings/available-rooms/${hostelId}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setRooms(data.rooms);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch rooms');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch available rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleProceedToPayment = () => {
    if (!selectedRoom) {
      Alert.alert('Error', 'Please select a room');
      return;
    }

    navigation.navigate('Payment', {
      bookingData: {
        roomId: selectedRoom._id,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        totalAmount: calculateTotalAmount(selectedRoom),
      },
    });
  };

  const calculateTotalAmount = (room: Room) => {
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return nights * room.price.amount;
  };

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[
        styles.roomCard,
        selectedRoom?._id === item._id && styles.selectedRoomCard,
      ]}
      onPress={() => handleRoomSelect(item)}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
        <Text style={styles.roomType}>{item.type}</Text>
      </View>

      <View style={styles.roomDetails}>
        <Text style={styles.capacity}>👥 {item.capacity} guests</Text>
        <Text style={styles.price}>
          GHS {item.price.amount}/night
        </Text>
      </View>

      {item.amenities && item.amenities.length > 0 && (
        <View style={styles.amenities}>
          <Text style={styles.amenitiesTitle}>Amenities:</Text>
          <Text style={styles.amenitiesText}>
            {item.amenities.join(', ')}
          </Text>
        </View>
      )}

      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          Total: GHS {calculateTotalAmount(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Finding available rooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Room</Text>
        <Text style={styles.subtitle}>
          {checkInDate.toDateString()} - {checkOutDate.toDateString()}
        </Text>
        <Text style={styles.guestCount}>{numberOfGuests} guest(s)</Text>
      </View>

      {rooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No rooms available for selected dates</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAvailableRooms}
          >
            <Text style={styles.retryButtonText}>Try Different Dates</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.roomList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.proceedButton,
                !selectedRoom && styles.disabledButton,
              ]}
              onPress={handleProceedToPayment}
              disabled={!selectedRoom}
            >
              <Text style={styles.proceedButtonText}>
                Proceed to Payment
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  guestCount: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomList: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedRoomCard: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF8F0',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  roomType: {
    fontSize: 16,
    color: '#FF8C00',
    fontWeight: '600',
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  capacity: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  amenities: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  amenitiesText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  proceedButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoomSelectionScreen;
