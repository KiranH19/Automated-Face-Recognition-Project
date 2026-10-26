import { Student, AttendanceRecord, TrainedModelInfo } from '../types';

const STORAGE_KEYS = {
  ADMIN: 'face_attendance_admin',
  STUDENTS: 'face_attendance_students_v3',
  ATTENDANCE: 'face_attendance_records_v3',
  MODEL: 'face_attendance_trained_model_v3',
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Authentication
export function checkAuthSession(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ADMIN) === 'true';
}

export function loginAdmin(username: string, pass: string): boolean {
  if (username.trim() === 'admin' && pass === 'admin123') {
    localStorage.setItem(STORAGE_KEYS.ADMIN, 'true');
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEYS.ADMIN);
}

// Students
export function getStudents(): Student[] {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStudent(
  student: Omit<Student, 'id' | 'created_at'>
): { success: boolean; student?: Student; error?: string } {
  const students = getStudents();

  // Check unique roll number
  const existing = students.find(
    (s) => s.roll_number.trim().toLowerCase() === student.roll_number.trim().toLowerCase()
  );
  if (existing) {
    return {
      success: false,
      error: `USN / Roll number ${student.roll_number} is already registered for ${existing.name}.`,
    };
  }

  const nextId = students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1;
  const newStudent: Student = {
    ...student,
    id: nextId,
    created_at: `${getTodayDateString()} ${getCurrentTimeString()}`,
  };

  students.unshift(newStudent);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  return { success: true, student: newStudent };
}

export function updateStudent(id: number, updates: Partial<Student>): boolean {
  const students = getStudents();
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;

  students[idx] = { ...students[idx], ...updates };
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  return true;
}

export function deleteStudent(studentId: number): Student | null {
  const students = getStudents();
  const index = students.findIndex((s) => s.id === studentId);
  if (index === -1) return null;

  const deleted = students.splice(index, 1)[0];
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

  // Cascade delete attendance
  const attendance = getAttendanceRecords();
  const updatedAttendance = attendance.filter((a) => a.student_id !== studentId);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));

  // Update trained model
  const model = getTrainedModel();
  if (model.studentSignatures && model.studentSignatures[studentId]) {
    delete model.studentSignatures[studentId];
    model.studentCount = Object.keys(model.studentSignatures).length;
    model.imageCount = Math.max(0, model.imageCount - (deleted.sampleCount || 30));
    saveTrainedModel(model);
  }

  return deleted;
}

// Attendance
export function getAttendanceRecords(): AttendanceRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function markStudentAttendance(
  studentId: number,
  photoUrl?: string
): { success: boolean; message: string; record?: AttendanceRecord; studentName?: string; student?: Student } {
  const students = getStudents();
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return { success: false, message: 'Student not found in registered records.' };
  }

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const records = getAttendanceRecords();

  const existing = records.find(
    (r) => r.student_id === studentId && r.attendance_date === today
  );

  if (existing) {
    return {
      success: false,
      message: 'Already marked today',
      record: existing,
      studentName: `${student.name} (${student.roll_number})`,
      student,
    };
  }

  // Determine late status if after 09:15 AM
  const currentHour = parseInt(currentTime.split(':')[0], 10);
  const currentMin = parseInt(currentTime.split(':')[1], 10);
  const isLate = currentHour > 9 || (currentHour === 9 && currentMin > 15);
  const status: 'Present' | 'Late' = isLate ? 'Late' : 'Present';

  const nextId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
  const newRecord: AttendanceRecord = {
    id: nextId,
    student_id: student.id,
    name: student.name,
    roll_number: student.roll_number,
    department: student.department,
    semester: student.semester,
    attendance_date: today,
    attendance_time: currentTime,
    status,
    created_at: `${today} ${currentTime}`,
    photoUrl: photoUrl || student.faceSamples?.[0],
  };

  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));

  return {
    success: true,
    message: `Marked at ${currentTime} (${status})`,
    record: newRecord,
    studentName: `${student.name} (${student.roll_number})`,
    student,
  };
}

// Clear all attendance logs
export function clearAllAttendance(): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
}

// Reset system to clean state
export function resetEntireDatabase(): void {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.MODEL);
}

// Model
export function getTrainedModel(): TrainedModelInfo {
  const raw = localStorage.getItem(STORAGE_KEYS.MODEL);
  if (!raw) {
    return {
      isTrained: false,
      trainedAt: null,
      studentCount: 0,
      imageCount: 0,
      studentSignatures: {},
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      isTrained: false,
      trainedAt: null,
      studentCount: 0,
      imageCount: 0,
      studentSignatures: {},
    };
  }
}

export function saveTrainedModel(model: TrainedModelInfo): void {
  localStorage.setItem(STORAGE_KEYS.MODEL, JSON.stringify(model));
}

// CSV Export
export function exportAttendanceCSV(filterDate = '', filterStudent = '', filterDepartment = ''): void {
  const records = getAttendanceRecords().filter((row) => {
    let matchDate = true;
    let matchStudent = true;
    let matchDept = true;

    if (filterDate) {
      matchDate = row.attendance_date === filterDate;
    }
    if (filterDepartment) {
      matchDept = row.department === filterDepartment;
    }
    if (filterStudent) {
      const q = filterStudent.toLowerCase();
      matchStudent =
        row.name.toLowerCase().includes(q) || row.roll_number.toLowerCase().includes(q);
    }
    return matchDate && matchStudent && matchDept;
  });

  const headers = ['Date', 'Time', 'Name', 'Roll Number', 'Department', 'Semester', 'Status'];
  const csvRows = [headers.join(',')];

  for (const row of records) {
    const escaped = [
      row.attendance_date,
      row.attendance_time,
      `"${row.name.replace(/"/g, '""')}"`,
      `"${row.roll_number.replace(/"/g, '""')}"`,
      `"${row.department.replace(/"/g, '""')}"`,
      `"${row.semester.replace(/"/g, '""')}"`,
      row.status,
    ];
    csvRows.push(escaped.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Attendance_Report_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
