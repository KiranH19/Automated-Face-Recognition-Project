export interface Student {
  id: number;
  name: string;
  roll_number: string;
  department: string;
  semester: string;
  created_at: string;
  sampleCount: number;
  faceSamples?: string[]; // base64 thumbnail samples
  featureProfile?: number[]; // averaged feature vector for recognition
  email?: string;
  phone?: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  name: string;
  roll_number: string;
  department: string;
  semester: string;
  attendance_date: string; // YYYY-MM-DD
  attendance_time: string; // HH:MM:SS
  status: 'Present' | 'Late' | 'Absent';
  created_at: string;
  photoUrl?: string;
}

export interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface TrainedModelInfo {
  isTrained: boolean;
  trainedAt: string | null;
  studentCount: number;
  imageCount: number;
  studentSignatures: Record<number, number[]>;
}

export type ViewType = 'dashboard' | 'students' | 'add-student' | 'attendance' | 'mark-attendance' | 'analytics';
