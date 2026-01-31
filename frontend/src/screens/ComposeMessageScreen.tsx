import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PremiumModal from '../components/PremiumModal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type ComposeMessageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ComposeMessage'>;
type ComposeMessageScreenRouteProp = RouteProp<RootStackParamList, 'ComposeMessage'>;

interface Props {
  navigation: ComposeMessageScreenNavigationProp;
  route: ComposeMessageScreenRouteProp;
}

interface Hostel {
  _id: string;
  name: string;
  address: string;
  manager: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size: number;
}

const ComposeMessageScreen: React.FC<Props> = ({ navigation }) => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  const { user } = useAuth();
  const { t, isPremiumFeature } = useLanguage();

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/hostels', {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setHostels(data.hostels);
      } else {
        Alert.alert(t('common.error'), data.message || t('error.network'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('error.network'));
    } finally {
      setLoading(false);
    }
  };

  const checkPremiumAccess = async (feature: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/subscriptions/has-feature/${feature}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();
      return data.hasFeature;
    } catch (error) {
      return false;
    }
  };

  const handleFileAttachment = async () => {
    const hasAccess = await checkPremiumAccess('fileAttachments');
    if (!hasAccess) {
      setPremiumFeature('fileAttachments');
      setShowPremiumModal(true);
      return;
    }

    Alert.alert(
      t('attachments.add'),
      t('attachments.types'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Photo/Video',
          onPress: pickImage,
        },
        {
          text: 'Document',
          onPress: pickDocument,
        },
      ]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error.permission'), 'Media library access is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const attachment: Attachment = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.${asset.uri.split('.').pop()}`,
        type: asset.type === 'image' ? 'image/jpeg' : asset.type === 'video' ? 'video/mp4' : asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
      };

      if (attachment.size > 50 * 1024 * 1024) { // 50MB
        Alert.alert(t('error.fileTooLarge'), t('attachments.maxSize'));
        return;
      }

      if (attachments.length >= 5) {
        Alert.alert(t('common.error'), t('attachments.maxFiles'));
        return;
      }

      setAttachments([...attachments, attachment]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'text/plain', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const attachment: Attachment = {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || 'application/octet-stream',
          size: result.size || 0,
        };

        if (attachment.size > 50 * 1024 * 1024) { // 50MB
          Alert.alert(t('error.fileTooLarge'), t('attachments.maxSize'));
          return;
        }

        if (attachments.length >= 5) {
          Alert.alert(t('common.error'), t('attachments.maxFiles'));
          return;
        }

        setAttachments([...attachments, attachment]);
      }
    } catch (error) {
      Alert.alert(t('error.uploadFailed'), 'Failed to pick document');
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
  };

  const handleSendMessage = async () => {
    if (!selectedHostel) {
      Alert.alert(t('common.error'), t('messages.selectHostel'));
      return;
    }

    if (!subject.trim()) {
      Alert.alert(t('common.error'), t('messages.subject'));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('common.error'), t('messages.content'));
      return;
    }

    // Check premium access for attachments
    if (attachments.length > 0) {
      const hasAccess = await checkPremiumAccess('fileAttachments');
      if (!hasAccess) {
        setPremiumFeature('fileAttachments');
        setShowPremiumModal(true);
        return;
      }
    }

    setSending(true);

    try {
      const formData = new FormData();

      formData.append('recipient', selectedHostel.manager._id);
      formData.append('hostel', selectedHostel._id);
      formData.append('subject', subject.trim());
      formData.append('content', content.trim());
      formData.append('messageType', messageType);
      formData.append('priority', priority);

      // Add attachments
      attachments.forEach((attachment, index) => {
        const fileData = {
          uri: Platform.OS === 'ios' ? attachment.uri.replace('file://', '') : attachment.uri,
          name: attachment.name,
          type: attachment.type,
        };
        formData.append('attachments', fileData as any);
      });

      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert(t('common.success'), 'Message sent successfully!', [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert(t('common.error'), data.message || 'Failed to send message');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('error.network'));
    } finally {
      setSending(false);
    }
  };

  const messageTypes = [
    { value: 'general', label: t('messageType.general') },
    { value: 'inquiry', label: t('messageType.inquiry') },
    { value: 'complaint', label: t('messageType.complaint') },
    { value: 'booking_question', label: t('messageType.booking_question') },
    { value: 'maintenance_related', label: t('messageType.maintenance') },
  ];

  const priorities = [
    { value: 'low', label: t('priority.low') },
    { value: 'medium', label: t('priority.medium') },
    { value: 'high', label: t('priority.high') },
    { value: 'urgent', label: t('priority.urgent') },
  ];

  const renderAttachment = ({ item, index }: { item: Attachment; index: number }) => (
    <View style={styles.attachmentItem}>
      <View style={styles.attachmentInfo}>
        <Text style={styles.attachmentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.attachmentSize}>
          {(item.size / 1024 / 1024).toFixed(2)} MB
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => removeAttachment(index)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('messages.compose')}</Text>
        <Text style={styles.subtitle}>{t('messages.sendMessage')}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{t('messages.selectHostel')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hostelSelector}>
          {hostels.map((hostel) => (
            <TouchableOpacity
              key={hostel._id}
              style={[
                styles.hostelCard,
                selectedHostel?._id === hostel._id && styles.selectedHostelCard,
              ]}
              onPress={() => setSelectedHostel(hostel)}
            >
              <Text style={styles.hostelName}>{hostel.name}</Text>
              <Text style={styles.hostelAddress}>{hostel.address}</Text>
              <Text style={styles.managerName}>
                {t('common.manager')}: {hostel.manager.firstName} {hostel.manager.lastName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('messages.messageType')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
          {messageTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                messageType === type.value && styles.selectedTypeButton,
              ]}
              onPress={() => setMessageType(type.value)}
            >
              <Text style={[
                styles.typeButtonText,
                messageType === type.value && styles.selectedTypeButtonText,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('messages.priority')}</Text>
        <View style={styles.prioritySelector}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.priorityButton,
                priority === p.value && styles.selectedPriorityButton,
              ]}
              onPress={() => setPriority(p.value)}
            >
              <Text style={[
                styles.priorityButtonText,
                priority === p.value && styles.selectedPriorityButtonText,
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('messages.subject')}</Text>
        <TextInput
          style={styles.subjectInput}
          value={subject}
          onChangeText={setSubject}
          placeholder={t('messages.subject')}
          maxLength={200}
        />

        <Text style={styles.label}>{t('messages.content')}</Text>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder={t('messages.content')}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        <Text style={styles.label}>{t('messages.attachments')}</Text>
        <TouchableOpacity style={styles.attachButton} onPress={handleFileAttachment}>
          <Text style={styles.attachButtonText}>{t('messages.attachFiles')}</Text>
        </TouchableOpacity>

        {attachments.length > 0 && (
          <FlatList
            data={attachments}
            renderItem={renderAttachment}
            keyExtractor={(item, index) => index.toString()}
            style={styles.attachmentsList}
            scrollEnabled={false}
          />
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={sending}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.disabledButton]}
            onPress={handleSendMessage}
            disabled={sending || !selectedHostel || !subject.trim() || !content.trim()}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>{t('messages.sendMessage')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        navigation={navigation}
        feature={premiumFeature}
      />
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  hostelSelector: {
    marginBottom: 8,
  },
  hostelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedHostelCard: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF8F0',
  },
  hostelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hostelAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 12,
    color: '#888',
  },
  typeSelector: {
    marginBottom: 8,
  },
  typeButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTypeButton: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedPriorityButton: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPriorityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subjectInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 120,
  },
  attachButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  attachmentsList: {
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ComposeMessageScreen;
