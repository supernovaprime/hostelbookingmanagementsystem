import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

type SupportedLanguage = keyof typeof translations;
type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  isPremiumFeature: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const translations = {
  en: {
    // Common
    'app.name': 'HostelHub',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.send': 'Send',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.manager': 'Manager',

    // Navigation
    'nav.home': 'Home',
    'nav.messages': 'Messages',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',

    // Messages
    'messages.title': 'Messages',
    'messages.compose': 'Compose',
    'messages.inbox': 'Inbox',
    'messages.sent': 'Sent',
    'messages.unread': 'Unread',
    'messages.attachments': 'Attachments',
    'messages.subject': 'Subject',
    'messages.content': 'Message',
    'messages.sendMessage': 'Send Message',
    'messages.reply': 'Reply',
    'messages.noMessages': 'No messages yet',
    'messages.selectHostel': 'Select Hostel',
    'messages.messageType': 'Message Type',
    'messages.priority': 'Priority',
    'messages.attachFiles': 'Attach Files',

    // Message Types
    'messageType.general': 'General Inquiry',
    'messageType.inquiry': 'Information Request',
    'messageType.complaint': 'Complaint',
    'messageType.booking_question': 'Booking Question',
    'messageType.maintenance': 'Maintenance Issue',

    // Priorities
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',

    // Premium Features
    'premium.title': 'Upgrade to Premium',
    'premium.fileAttachments': 'File Attachments',
    'premium.multiLanguage': 'Multi-Language Support',
    'premium.description': 'Unlock premium messaging features',
    'premium.upgrade': 'Upgrade Now',
    'premium.maybeLater': 'Maybe Later',
    'premium.benefits': 'Premium Benefits',
    'premium.plan': 'Premium Plan',
    'premium.price': '9.99',
    'premium.period': '/month',

    // File Attachments
    'attachments.add': 'Add Attachment',
    'attachments.remove': 'Remove',
    'attachments.maxFiles': 'Maximum 5 files',
    'attachments.maxSize': '50MB per file',
    'attachments.types': 'Images, videos, and documents',
    'attachments.premiumRequired': 'File attachments require premium subscription',

    // Languages
    'language.english': 'English',
    'language.spanish': 'Spanish',
    'language.french': 'French',
    'language.german': 'German',
    'language.chinese': 'Chinese',
    'language.japanese': 'Japanese',
    'language.arabic': 'Arabic',
    'language.hindi': 'Hindi',

    // Errors
    'error.network': 'Network error. Please try again.',
    'error.permission': 'Permission denied',
    'error.fileTooLarge': 'File too large',
    'error.invalidFileType': 'Invalid file type',
    'error.uploadFailed': 'Upload failed',
  },
  es: {
    // Common
    'app.name': 'HostelHub',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.send': 'Enviar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.close': 'Cerrar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.manager': 'Manager',

    // Navigation
    'nav.home': 'Inicio',
    'nav.messages': 'Mensajes',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',

    // Messages
    'messages.title': 'Mensajes',
    'messages.compose': 'Redactar',
    'messages.inbox': 'Bandeja de entrada',
    'messages.sent': 'Enviados',
    'messages.unread': 'No leídos',
    'messages.attachments': 'Adjuntos',
    'messages.subject': 'Asunto',
    'messages.content': 'Mensaje',
    'messages.sendMessage': 'Enviar Mensaje',
    'messages.reply': 'Responder',
    'messages.noMessages': 'Aún no hay mensajes',
    'messages.selectHostel': 'Seleccionar Hostel',
    'messages.messageType': 'Tipo de Mensaje',
    'messages.priority': 'Prioridad',
    'messages.attachFiles': 'Adjuntar Archivos',

    // Message Types
    'messageType.general': 'Consulta General',
    'messageType.inquiry': 'Solicitud de Información',
    'messageType.complaint': 'Queja',
    'messageType.booking_question': 'Pregunta de Reserva',
    'messageType.maintenance': 'Problema de Mantenimiento',

    // Priorities
    'priority.low': 'Baja',
    'priority.medium': 'Media',
    'priority.high': 'Alta',
    'priority.urgent': 'Urgente',

    // Premium Features
    'premium.title': 'Actualizar a Premium',
    'premium.fileAttachments': 'Adjuntos de Archivos',
    'premium.multiLanguage': 'Soporte Multiidioma',
    'premium.description': 'Desbloquea funciones premium de mensajería',
    'premium.upgrade': 'Actualizar Ahora',
    'premium.maybeLater': 'Quizás Después',
    'premium.benefits': 'Beneficios Premium',
    'premium.plan': 'Plan Premium',
    'premium.price': '9.99',
    'premium.period': '/mes',

    // File Attachments
    'attachments.add': 'Agregar Adjunto',
    'attachments.remove': 'Eliminar',
    'attachments.maxFiles': 'Máximo 5 archivos',
    'attachments.maxSize': '50MB por archivo',
    'attachments.types': 'Imágenes, videos y documentos',
    'attachments.premiumRequired': 'Los adjuntos requieren suscripción premium',

    // Languages
    'language.english': 'Inglés',
    'language.spanish': 'Español',
    'language.french': 'Francés',
    'language.german': 'Alemán',
    'language.chinese': 'Chino',
    'language.japanese': 'Japonés',
    'language.arabic': 'Árabe',
    'language.hindi': 'Hindi',

    // Errors
    'error.network': 'Error de red. Por favor, inténtalo de nuevo.',
    'error.permission': 'Permiso denegado',
    'error.fileTooLarge': 'Archivo demasiado grande',
    'error.invalidFileType': 'Tipo de archivo inválido',
    'error.uploadFailed': 'Error al subir archivo',
  },
  fr: {
    // Common
    'app.name': 'HostelHub',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.send': 'Envoyer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.close': 'Fermer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.ok': 'OK',
    'common.manager': 'Directeur',

    // Navigation
    'nav.home': 'Accueil',
    'nav.messages': 'Messages',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',

    // Messages
    'messages.title': 'Messages',
    'messages.compose': 'Rédiger',
    'messages.inbox': 'Boîte de réception',
    'messages.sent': 'Envoyés',
    'messages.unread': 'Non lus',
    'messages.attachments': 'Pièces jointes',
    'messages.subject': 'Sujet',
    'messages.content': 'Message',
    'messages.sendMessage': 'Envoyer le Message',
    'messages.reply': 'Répondre',
    'messages.noMessages': 'Aucun message pour le moment',
    'messages.selectHostel': 'Sélectionner l\'Hôtel',
    'messages.messageType': 'Type de Message',
    'messages.priority': 'Priorité',
    'messages.attachFiles': 'Joindre des Fichiers',

    // Message Types
    'messageType.general': 'Demande Générale',
    'messageType.inquiry': 'Demande d\'Information',
    'messageType.complaint': 'Plainte',
    'messageType.booking_question': 'Question de Réservation',
    'messageType.maintenance': 'Problème de Maintenance',

    // Priorities
    'priority.low': 'Faible',
    'priority.medium': 'Moyenne',
    'priority.high': 'Élevée',
    'priority.urgent': 'Urgente',

    // Premium Features
    'premium.title': 'Passer à Premium',
    'premium.fileAttachments': 'Pièces Jointes',
    'premium.multiLanguage': 'Support Multilingue',
    'premium.description': 'Débloquez les fonctionnalités premium de messagerie',
    'premium.upgrade': 'Mettre à Niveau Maintenant',
    'premium.maybeLater': 'Peut-être Plus Tard',
    'premium.benefits': 'Avantages Premium',
    'premium.plan': 'Plan Premium',
    'premium.price': '9.99',
    'premium.period': '/mois',

    // File Attachments
    'attachments.add': 'Ajouter une Pièce Jointe',
    'attachments.remove': 'Supprimer',
    'attachments.maxFiles': 'Maximum 5 fichiers',
    'attachments.maxSize': '50MB par fichier',
    'attachments.types': 'Images, vidéos et documents',
    'attachments.premiumRequired': 'Les pièces jointes nécessitent un abonnement premium',

    // Languages
    'language.english': 'Anglais',
    'language.spanish': 'Espagnol',
    'language.french': 'Français',
    'language.german': 'Allemand',
    'language.chinese': 'Chinois',
    'language.japanese': 'Japonais',
    'language.arabic': 'Arabe',
    'language.hindi': 'Hindi',

    // Errors
    'error.network': 'Erreur réseau. Veuillez réessayer.',
    'error.permission': 'Permission refusée',
    'error.fileTooLarge': 'Fichier trop volumineux',
    'error.invalidFileType': 'Type de fichier invalide',
    'error.uploadFailed': 'Échec du téléchargement',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isPremiumFeature, setIsPremiumFeature] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    loadLanguagePreference();
    checkPremiumStatus();
  }, [user, token]);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage && translations[savedLanguage as SupportedLanguage]) {
        setLanguageState(savedLanguage as SupportedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      if (token) {
        const response = await fetch('http://localhost:5000/api/subscriptions/has-feature/multiLanguage', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsPremiumFeature(data.hasFeature);
        } else {
          setIsPremiumFeature(false);
        }
      } else {
        setIsPremiumFeature(false);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremiumFeature(false);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        await AsyncStorage.setItem('userLanguage', lang);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const t = (key: TranslationKey): string => {
    const currentTranslations = translations[language];
    return currentTranslations?.[key] || translations.en[key] || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isPremiumFeature,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
