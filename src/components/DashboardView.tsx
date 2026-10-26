import React from 'react';
import { AttendanceRecord, ViewType, TrainedModelInfo } from '../types';
import {
  ScanFace,
  BrainCircuit,
  Users,
  CheckCircle2,
  ClipboardList,
  Clock,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: string;
  totalStudents: number;
  todayPresent: number;
  totalAttendance: number;
  recentAttendance: AttendanceRecord[];
  model: TrainedModelInfo;
  onNavigate: (view: ViewType) => void;
  onTrainModel: () => void;
  isTraining: boolean;
  onClearAttendance: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  totalStudents,
  todayPresent,
  totalAttendance,
  recentAttendance,
  model,
  onNavigate,
  onTrainModel,
  isTraining,
  onClearAttendance,
}) => {
  const attendanceRate = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

  return (
    <div>
      {/* Page Header */}
      <section className="page-head">
        <div>
          <p className="eyebrow">
            <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
            Administrator Portal · {currentUser}
          </p>
          <h1>Attendance Dashboard</h1>
        </div>
        <div className="actions">
          {totalAttendance > 0 && (
            <button
              className="secondary-btn"
              type="button"
              onClick={onClearAttendance}
              title="Reset attendance logs for today or presentation"
            >
              <RotateCcw size={15} /> Clear Today's Attendance
            </button>
          )}

          <button
            className="secondary-btn"
            type="button"
            onClick={onTrainModel}
            disabled={isTraining || totalStudents === 0}
            title={
              totalStudents === 0
                ? 'Enroll students first'
                : model.isTrained
                ? `Trained with ${model.imageCount} real face samples`
                : 'Click to train model'
            }
          >
            <BrainCircuit size={16} color="var(--primary)" />
            {isTraining
              ? 'Training Model...'
              : model.isTrained
              ? 'Re-Train Model'
              : 'Train Model'}
          </button>

          <button
            className="primary-btn"
            type="button"
            onClick={() => onNavigate('mark-attendance')}
          >
            <ScanFace size={16} /> Auto Attendance Scanner
          </button>
        </div>
      </section>

      {/* Hero Terminal Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={18} color="#93c5fd" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bfdbfe' }}>
              Real-Time Computer Vision Terminal
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800 }}>
            Hands-Free Facial Recognition Biometrics
          </h2>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#dbeafe', lineHeight: 1.5 }}>
            Students stand in front of the camera to have their identity verified and attendance logged in real time.
            No manual button clicks or touchpoints needed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {totalStudents === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate('add-student')}
              style={{
                background: '#ffffff',
                color: '#1e3a8a',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <UserPlus size={16} /> Enroll First Student
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('mark-attendance')}
              style={{
                background: '#ffffff',
                color: '#1e3a8a',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              Open Live Scanner <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>

      {/* KPI Stats */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span>Enrolled Students</span>
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={20} />
            </div>
          </div>
          <strong>{totalStudents}</strong>
          <div className="stat-footer">
            <span style={{ color: 'var(--muted)' }}>
              {totalStudents > 0
                ? `${totalStudents} registered with 30-frame face datasets`
                : 'No students enrolled yet'}
            </span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span>Present Today</span>
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{todayPresent}</strong>
          <div className="stat-footer">
            <TrendingUp size={14} color="#059669" />
            <span style={{ color: '#059669', fontWeight: 700 }}>{attendanceRate}% attendance rate</span>
            <span style={{ color: 'var(--muted)' }}>· for today</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span>Total Attendance Logs</span>
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <ClipboardList size={20} />
            </div>
          </div>
          <strong>{totalAttendance}</strong>
          <div className="stat-footer">
            <Clock size={14} />
            <span>Cumulative verified attendance records</span>
          </div>
        </article>
      </section>

      {/* Recent Attendance Panel */}
      <section className="panel">
        <div className="section-title">
          <h2>Recent Attendance Records</h2>
          {totalAttendance > 0 && (
            <button type="button" onClick={() => onNavigate('attendance')}>
              View all records →
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
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.length > 0 ? (
                recentAttendance.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="student-cell">
                        {row.photoUrl ? (
                          <img src={row.photoUrl} alt={row.name} className="student-avatar" />
                        ) : (
                          <div className="student-avatar">{row.name[0]}</div>
                        )}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.94rem' }}>{row.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{row.semester}</span>
                        </div>
                      </div>
                    </td>
                    <td>{row.roll_number}</td>
                    <td>{row.department}</td>
                    <td>{row.attendance_date}</td>
                    <td>{row.attendance_time}</td>
                    <td>
                      <span className={`status-badge ${row.status.toLowerCase()}`}>
                        <CheckCircle2 size={13} /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    {totalStudents === 0 ? (
                      <div>
                        <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                        <div style={{ fontWeight: 600 }}>No students registered yet</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                          Start by adding students in the "Add Student" section using your live webcam.
                        </div>
                      </div>
                    ) : (
                      'No attendance records logged yet today. Launch the Auto Attendance Scanner to verify attendance.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
