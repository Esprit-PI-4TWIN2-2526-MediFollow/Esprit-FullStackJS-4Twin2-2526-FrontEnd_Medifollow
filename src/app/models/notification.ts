export interface Notification {
  _id: string;
  recipientId: string;
  type: 'symptom' | 'consultation' | 'upcoming-consultation' | 'questionnaire' | 'prescription';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data: any;
  patientId?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email?: string;
    phoneNumber?: string;
  };
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
