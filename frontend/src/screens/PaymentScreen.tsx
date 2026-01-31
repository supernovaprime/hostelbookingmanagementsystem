import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { WebView } from 'react-native-webview';

type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

interface Props {
  navigation: PaymentScreenNavigationProp;
  route: {
    params: {
      bookingId: string;
      amount: number;
      type: 'booking_payment' | 'deposit' | 'final_payment' | 'extra_charges';
      description: string;
    };
  };
}

const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, token } = useAuth();
  const { bookingId, amount, type, description } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  const API_BASE_URL = 'http://localhost:5000/api';

  const initializePayment = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to make a payment');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          amount,
          type,
          callback_url: 'hostelbooking://payment/callback',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initialization failed');
      }

      setPaystackUrl(data.paystack.authorization_url);
      setPaymentStatus('processing');
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentCallback = async (url: string) => {
    // Extract reference from URL
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const reference = urlParams.get('reference');

    if (reference && url.includes('payment/callback')) {
      try {
        const response = await fetch(`${API_BASE_URL}/payments/verify/${reference}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setPaymentStatus('completed');
          Alert.alert('Success', 'Payment completed successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          setPaymentStatus('failed');
          Alert.alert('Payment Failed', data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus('failed');
        Alert.alert('Error', 'Failed to verify payment');
      }
    }
  };

  if (paystackUrl) {
    return (
      <WebView
        source={{ uri: paystackUrl }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes('payment/callback')) {
            handlePaymentCallback(navState.url);
          }
        }}
        style={styles.webview}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Details</Text>
        <Text style={styles.subtitle}>Complete your hostel booking payment</Text>
      </View>

      <View style={styles.paymentCard}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amount}>GHS {amount.toFixed(2)}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Payment Type:</Text>
          <Text style={styles.detailValue}>
            {type.replace('_', ' ').toUpperCase()}
          </Text>

          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>{description}</Text>

          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{user?.email}</Text>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityTitle}>🔒 Secure Payment</Text>
          <Text style={styles.securityText}>
            Your payment is processed securely through Paystack with bank-level encryption.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.payButton, isLoading && styles.disabledButton]}
          onPress={initializePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay GHS {amount.toFixed(2)} with Paystack
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  securityNote: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
  },
  payButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
});

export default PaymentScreen;
