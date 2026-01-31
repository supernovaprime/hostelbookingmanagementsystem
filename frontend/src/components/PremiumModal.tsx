import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type PremiumModalNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: PremiumModalNavigationProp;
  feature: string;
}

const PremiumModal: React.FC<Props> = ({ visible, onClose, navigation, feature }) => {
  const handleUpgradePress = () => {
    onClose();
    // Navigate to premium subscription screen (to be implemented)
    // For now, just show an alert
    alert('Premium subscription feature coming soon!');
  };

  const getFeatureDescription = (feature: string) => {
    switch (feature) {
      case 'fileAttachments':
        return {
          title: 'File Attachments',
          description: 'Attach photos, videos, and documents to your messages for better communication with hostel managers.',
          benefits: [
            'Share property photos and documents',
            'Send maintenance request images',
            'Attach booking confirmations',
            'Upload identification documents'
          ]
        };
      case 'multiLanguage':
        return {
          title: 'Multi-Language Support',
          description: 'Communicate in your preferred language with full translation support.',
          benefits: [
            'Automatic message translation',
            'Interface in multiple languages',
            'Better communication globally',
            'Localized support'
          ]
        };
      default:
        return {
          title: 'Premium Feature',
          description: 'Unlock this premium feature to enhance your experience.',
          benefits: ['Enhanced functionality', 'Better user experience', 'Priority support']
        };
    }
  };

  const featureData = getFeatureDescription(feature);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade to Premium</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>⭐</Text>
            </View>

            <Text style={styles.featureTitle}>{featureData.title}</Text>
            <Text style={styles.featureDescription}>{featureData.description}</Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Premium Benefits:</Text>
              {featureData.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>$9.99<Text style={styles.pricingPeriod}>/month</Text></Text>
              <Text style={styles.pricingDescription}>Cancel anytime</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIconText: {
    fontSize: 30,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#FF8C00',
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  pricingContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  pricingPeriod: {
    fontSize: 16,
    color: '#666',
  },
  pricingDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  upgradeButton: {
    flex: 2,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PremiumModal;
