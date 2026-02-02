import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';

type MessageDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MessageDetail'>;
type MessageDetailScreenRouteProp = RouteProp<RootStackParamList, 'MessageDetail'>;

interface Props {
  navigation: MessageDetailScreenNavigationProp;
  route: MessageDetailScreenRouteProp;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  hostel: {
    _id: string;
    name: string;
    address: string;
  };
  subject: string;
  content: string;
  messageType: string;
  status: string;
  priority: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
}

const MessageDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch conversation');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch conversation');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversation();
  }, [conversationId]);

  const handleSendReply = async () => {
    if (!replyContent.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    const originalMessage = messages[0];
    if (!originalMessage) return;

    setSendingReply(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: user?.id === originalMessage.sender._id ? originalMessage.recipient._id : originalMessage.sender._id,
          hostel: originalMessage.hostel._id,
          subject: `Re: ${originalMessage.subject}`,
          content: replyContent.trim(),
          messageType: 'general',
          priority: 'medium',
          parentMessage: originalMessage._id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setReplyContent('');
        fetchConversation(); // Refresh the conversation
      } else {
        Alert.alert('Error', data.message || 'Failed to send reply');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isFromMe = item.sender._id === user?.id;

    return (
      <View style={[styles.messageContainer, isFromMe ? styles.myMessage : styles.theirMessage]}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>
            {isFromMe ? 'You' : `${item.sender.firstName} ${item.sender.lastName}`}
          </Text>
          <Text style={styles.messageTime}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={styles.messageSubject}>{item.subject}</Text>
        <Text style={styles.messageContent}>{item.content}</Text>

        <View style={styles.messageFooter}>
          <View style={styles.messageTags}>
            <Text style={[styles.messageType, { backgroundColor: getMessageTypeColor(item.messageType) }]}>
              {item.messageType.replace('_', ' ')}
            </Text>
            <Text style={[styles.messagePriority, { backgroundColor: getPriorityColor(item.priority) }]}>
              {item.priority}
            </Text>
          </View>
          <Text style={styles.messageStatus}>{item.status}</Text>
        </View>
      </View>
    );
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry': return '#007AFF';
      case 'complaint': return '#FF3B30';
      case 'booking_question': return '#FF9500';
      case 'maintenance_related': return '#FFCC00';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      default: return '#8E8E93';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  const conversationTitle = messages.length > 0 ? messages[0].subject : 'Conversation';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {conversationTitle}
        </Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.replyContainer}>
        <TextInput
          style={styles.replyInput}
          value={replyContent}
          onChangeText={setReplyContent}
          placeholder="Type your reply..."
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, sendingReply && styles.disabledButton]}
          onPress={handleSendReply}
          disabled={sendingReply || !replyContent.trim()}
        >
          {sendingReply ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF8C00',
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
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
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  messageContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTags: {
    flexDirection: 'row',
    gap: 8,
  },
  messageType: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  messagePriority: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
  },
  messageStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  replyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MessageDetailScreen;
