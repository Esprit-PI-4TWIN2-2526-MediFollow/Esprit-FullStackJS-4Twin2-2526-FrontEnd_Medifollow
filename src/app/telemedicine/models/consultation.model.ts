export interface Consultation {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  };
  type: 'scheduled' | 'urgent' | 'follow-up';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  reason: string;
  notes?: string;
  diagnosis?: string;
  recommendations?: string;
  nextAppointmentSuggested?: Date;
  prescriptions?: string[];
  documents?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateConsultationDto {
  patientId: string;
  doctorId: string;
  type?: 'scheduled' | 'urgent' | 'follow-up';
  scheduledAt: string;
  reason: string;
}

export interface UpdateConsultationDto {
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  diagnosis?: string;
  recommendations?: string;
  nextAppointmentSuggested?: string;
  startedAt?: string;
  endedAt?: string;
}
