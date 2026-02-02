import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type PaymentApprovalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentApproval'>;

interface Props {
  navigation: PaymentApprovalScreenNavigationProp;
}

interface Payment {
  _id: string;
  reference: string;
  amount: {
    value: number;
    currency: string;
  };
  type: string;
  method: {
    type: string;
    provider: string;
  };
  status: string;
  approval: {
    status: string;
    rejectionReason?: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  hostel: {
    name: string;
  };
  createdAt: string;
}

const PaymentApprovalScreen: React.FC<Props> = ({ navigation }) => {
  const { user, token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/pending-approval`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPayments(data.payments);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch payments');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPendingPayments();
  };

  const openApprovalModal = (payment: Payment, actionType: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setAction(actionType);
    setNotes('');
    setRejectionReason('');
    setModalVisible(true);
  };

  const handlePaymentAction = async () => {
    if (!selectedPayment) return;

    setProcessing(true);
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const body = action === 'approve'
        ? { notes }
        : { rejectionReason, notes };

      const response = await fetch(`${API_BASE_URL}/payments/${endpoint}/${selectedPayment._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          `Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false);
                fetchPendingPayments();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Action failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment action');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.reference}>Ref: {item.reference}</Text>
        <Text style={styles.amount}>
          GHS {item.amount.value.toFixed(2)}
        </Text>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.detailLabel}>Tenant:</Text>
        <Text style={styles.detailValue}>
          {item.tenant.firstName} {item.tenant.lastName}
        </Text>

        <Text style={styles.detailLabel}>Hostel:</Text>
        <Text style={styles.detailValue}>{item.hostel.name}</Text>

        <Text style={styles.detailLabel}>Type:</Text>
        <Text style={styles.detailValue}>
          {item.type.replace('_', ' ').toUpperCase()}
        </Text>

        <Text style={styles.detailLabel}>Method:</Text>
        <Text style={styles.detailValue}>
          {item.method.type === 'mobile_money'
            ? `${item.method.provider.toUpperCase()} Mobile Money`
            : item.method.type.toUpperCase()
          }
        </Text>

        <Text style={styles.detailLabel}>Date:</Text>
        <Text style={styles.detailValue}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => openApprovalModal(item, 'approve')}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => openApprovalModal(item, 'reject')}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Loading pending payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Approvals</Text>
        <Text style={styles.subtitle}>Review and approve tenant payments</Text>
      </View>

      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending payments to approve</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.paymentList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {action === 'approve' ? 'Approve Payment' : 'Reject Payment'}
            </Text>

            {selectedPayment && (
              <View style={styles.modalPaymentInfo}>
                <Text style={styles.modalPaymentRef}>
                  Reference: {selectedPayment.reference}
                </Text>
                <Text style={styles.modalPaymentAmount}>
                  Amount: GHS {selectedPayment.amount.value.toFixed(2)}
                </Text>
                <Text style={styles.modalPaymentTenant}>
                  Tenant: {selectedPayment.tenant.firstName} {selectedPayment.tenant.lastName}
                </Text>
              </View>
            )}

            {action === 'reject' && (
              <TextInput
                style={styles.input}
                placeholder="Rejection reason (required)"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={3}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Additional notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  action === 'approve' ? styles.approveModalButton : styles.rejectModalButton,
                  processing && styles.disabledButton,
                ]}
                onPress={handlePaymentAction}
                disabled={processing || (action === 'reject' && !rejectionReason.trim())}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {action === 'approve' ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  paymentList: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  paymentDetails: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalPaymentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalPaymentRef: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modalPaymentAmount: {
    fontSize: 16,
    color: '#FF8C00',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalPaymentTenant: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  approveModalButton: {
    backgroundColor: '#28a745',
  },
  rejectModalButton: {
    backgroundColor: '#dc3545',
  },
  cancelModalButton: {
    backgroundColor: '#6c757d',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PaymentApprovalScreen;
