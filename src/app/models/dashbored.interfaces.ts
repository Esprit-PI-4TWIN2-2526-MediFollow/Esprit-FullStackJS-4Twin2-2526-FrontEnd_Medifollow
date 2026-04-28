// dashboard.interfaces.ts (fichier corrigé)
export interface Summary {
  patients: { total: number; newThisWeek: number };
  doctors: { total: number };
  services: {
    total: number;
    active: number;
    inactive: number;
    emergency?: number; // Ajouté pour le template
  };
  questionnaires: { total: number; active: number; totalResponses: number };
  staff?: {
    doctors: { total: number };
    nurses: { total: number };
    coordinators: { total: number };
  };
  symptoms?: {
    totalResponses: number;
    pendingValidations: number;
  };
  followup?: {
    overallRate: number;
    todayRate: number;
    respondedToday: number;
    everResponded: number;
    completedToday: number;
  };
  alerts?: {
    highRiskPatients: number;
  };
}

export interface ActivityPoint {
  date: string;
  newPatients: number;
  submittedResponses: number;
}

export interface ComplianceService {
  serviceName: string;
  complianceRate: number;
  totalResponses: number;
  patientCount: number;
  activeQuestionnaires: number;
  nonCompliantEstimate: number;
  distinctRespondents?: number; // Ajouté
}

export interface QuestionnaireStats {
  topQuestionnaires: {
    title: string;
    service: string;
    status: string;
    responses: number;
    questions: number;
  }[];
}

export interface Alert {
  id?: string;
  type?: 'critical' | 'warning' | 'info';
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  service?: string;
  createdAt?: string;
}

export interface HighRiskPatient {
  _id: string;
  firstName: string;
  lastName: string;
  assignedDepartment?: string;
  riskScore?: number;
  lastActivity?: string;
  totalResponses?: number; // Ajouté
  activeQuestionnaires?: number; // Ajouté
}

export interface GlobalFollowupRate {
  rate: number;
  total: number;
  completed: number;
}

export interface AIInsight {
  type: string;
  category: string;
  message: string;
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface InactivePatient {
  _id: string;
  firstName: string;
  lastName: string;
  assignedDepartment?: string;
  lastSeen?: string;
  daysSinceActivity?: number;
  email?: string; // Ajouté
  lastLogin?: string; // Ajouté
}
