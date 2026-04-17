export interface MajorFinding {
  label: string;
  value: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export interface AiAnalysis {
  _id?: string;
  patient: string;                    // ObjectId sous forme de string
  analysis: string;
  key_findings: string[];             // tableau de findings importants
  gravity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  answers: Array<{                    // même structure que dans le schema
    question: string;
    answer: any;
  }>;
  recommendations?: string;           // peut être null au début
  createdAt?: string;
  updatedAt?: string;

}
