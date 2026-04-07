export interface Alert {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
email?: string;
    avatarUrl?: string;
    phoneNumber?: string;
  };
  response: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  alertProbability: number;
  isRead: boolean;
  readAt: Date | null;
  doctorId: string;
  createdAt: Date;
}
