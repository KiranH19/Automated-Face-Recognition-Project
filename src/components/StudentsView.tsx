import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, ViewType } from '../types';
import {
  UserPlus,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  GraduationCap,
  Building,
  Mail,
  Phone,
  Clock,
  X,
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onNavigate: (view: ViewType) => void;
  onDeleteStudent: (id: number) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  attendanceRecords,
  onNavigate,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => set.add(s.department));
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      let matchesSearch = true;
      let matchesDept = true;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        matchesSearch =
          s.name.toLowerCase().includes(q) ||
          s.roll_number.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q);
      }

      if (selectedDept !== 'all') {
        matchesDept = s.department === selectedDept;
      }

      return matchesSearch && matchesDept;
    });
  }, [students, searchTerm, selectedDept]);

  const confirmDelete = () => {
    if (studentToDelete) {
      onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  // Student specific history
  const studentHistory = useMemo(() => {
    if (!viewingStudent) return [];
    return attendanceRecords.filter((r) => r.student_id === viewingStudent.id);
  }, [viewingStudent, attendanceRecords]);

  return (
    <div>
      <section className="page-head">
        <div>
          <p className="eyebrow">Directory</p>
          <h1>Enrolled Students</h1>
        </div>
        <button
          className="primary-btn"
          type="button"
          onClick={() => onNavigate('add-student')}
        >
          <UserPlus size={16} /> Enroll New Student
        </button>
      </section>

      <section className="panel">
        <div className="filter-row" style={{ gridTemplateColumns: 'minmax(240px, 1fr) 220px auto' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
              }}
            />
            <input
              type="search"
              placeholder="Search by student name, USN, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {(searchTerm || selectedDept !== 'all') && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('all');
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Face Samples</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentAttendanceCount = attendanceRecords.filter(
                    (a) => a.student_id === student.id
                  ).length;

                  return (
                    <tr key={student.id}>
                      <td>
                        <div
                          className="student-cell"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setViewingStudent(student)}
                        >
                          {student.faceSamples?.[0] ? (
                            <img
                              src={student.faceSamples[0]}
                              alt={student.name}
                              className="student-avatar"
                            />
                          ) : (
                            <div className="student-avatar">{student.name[0]}</div>
                          )}
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.94rem' }}>
                              {student.name}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                              Added {student.created_at.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code
                          style={{
                            background: 'var(--surface-raised)',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                          }}
                        >
                          {student.roll_number}
                        </code>
                      </td>
                      <td>{student.department}</td>
                      <td>{student.semester}</td>
                      <td>
                        <span style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                          {student.sampleCount || 30} images ·{' '}
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            {studentAttendanceCount} attendance logs
                          </span>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ minHeight: '34px', padding: '0 10px', fontSize: '0.82rem' }}
                            onClick={() => setViewingStudent(student)}
                            title="View Student Profile"
                          >
                            <Eye size={14} /> Profile
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => setStudentToDelete(student)}
                            title="Delete Student"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    No matching students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Student Profile & History Modal */}
      {viewingStudent && (
        <div className="modal-backdrop" onClick={() => setViewingStudent(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Student Profile</h3>
              <button
                type="button"
                className="flash-close"
                onClick={() => setViewingStudent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
              {viewingStudent.faceSamples?.[0] ? (
                <img
                  src={viewingStudent.faceSamples[0]}
                  alt={viewingStudent.name}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)',
                  }}
                />
              ) : (
                <div
                  className="student-avatar"
                  style={{ width: '72px', height: '72px', fontSize: '1.8rem' }}
                >
                  {viewingStudent.name[0]}
                </div>
              )}
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{viewingStudent.name}</h4>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  Roll No: <strong>{viewingStudent.roll_number}</strong>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {viewingStudent.department} · {viewingStudent.semester}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-raised)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Contact Email</div>
                <strong>{viewingStudent.email || 'student@college.edu'}</strong>
              </div>
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-raised)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Biometric Status</div>
                <strong style={{ color: 'var(--success)' }}>
                  ✓ {viewingStudent.sampleCount || 30} Samples Trained
                </strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <strong style={{ fontSize: '0.95rem' }}>Attendance Record History</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  Total: {studentHistory.length} logs
                </span>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
                {studentHistory.length > 0 ? (
                  studentHistory.map((hist) => (
                    <div
                      key={hist.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--surface-raised)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="var(--primary)" />
                        <span>{hist.attendance_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="var(--muted)" />
                        <span>{hist.attendance_time}</span>
                        <span className={`status-badge ${hist.status.toLowerCase()}`}>
                          {hist.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', padding: '12px 0' }}>
                    No past attendance records for this student yet.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setViewingStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="modal-backdrop" onClick={() => setStudentToDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: 'var(--danger)' }}>
              Delete Student Record?
            </h3>
            <p className="muted" style={{ margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{studentToDelete.name}</strong> (
              {studentToDelete.roll_number})? All associated facial biometric models and attendance
              records will be permanently removed.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                style={{ minHeight: '40px', padding: '0 16px' }}
                onClick={confirmDelete}
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
