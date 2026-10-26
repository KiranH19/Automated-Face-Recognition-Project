import React, { useMemo } from 'react';
import { Student, AttendanceRecord, ViewType } from '../types';
import { getTodayDateString, exportAttendanceCSV } from '../services/storage';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
  Building,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface AnalyticsViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onNavigate: (view: ViewType) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  attendanceRecords,
  onNavigate,
}) => {
  const today = getTodayDateString();

  // Compute department breakdown
  const departmentStats = useMemo(() => {
    const map: Record<string, { total: number; presentToday: number }> = {};

    students.forEach((s) => {
      if (!map[s.department]) {
        map[s.department] = { total: 0, presentToday: 0 };
      }
      map[s.department].total += 1;
    });

    attendanceRecords
      .filter((r) => r.attendance_date === today)
      .forEach((r) => {
        if (map[r.department]) {
          map[r.department].presentToday += 1;
        }
      });

    return Object.entries(map).map(([dept, data]) => {
      const percentage = data.total > 0 ? Math.round((data.presentToday / data.total) * 100) : 0;
      return {
        department: dept,
        total: data.total,
        present: data.presentToday,
        percentage,
      };
    });
  }, [students, attendanceRecords, today]);

  // Overall metrics
  const totalStudents = students.length;
  const todayPresentCount = attendanceRecords.filter((r) => r.attendance_date === today).length;
  const todayAttendanceRate = totalStudents > 0 ? Math.round((todayPresentCount / totalStudents) * 100) : 0;

  const lateCount = attendanceRecords.filter(
    (r) => r.attendance_date === today && r.status === 'Late'
  ).length;

  return (
    <div>
      <section className="page-head">
        <div>
          <p className="eyebrow">Insights & Reports</p>
          <h1>Attendance Analytics</h1>
        </div>
        <div className="actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => exportAttendanceCSV()}
          >
            <Download size={16} /> Export All Data (CSV)
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => onNavigate('mark-attendance')}
          >
            Mark Attendance
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-header">
            <span>Today's Attendance Rate</span>
            <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <strong>{todayAttendanceRate}%</strong>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${todayAttendanceRate}%`, background: '#059669' }}
            />
          </div>
          <div className="stat-footer">
            <CheckCircle2 size={14} color="#059669" />
            <span>{todayPresentCount} of {totalStudents} students present</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span>On-Time vs Late Check-ins</span>
            <div className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={20} />
            </div>
          </div>
          <strong>{todayPresentCount - lateCount} <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--muted)' }}>On-time</span></strong>
          <div className="stat-footer" style={{ marginTop: '16px' }}>
            <span>{lateCount} marked as late (after 09:15 AM)</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card-header">
            <span>Enrolled Departments</span>
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Building size={20} />
            </div>
          </div>
          <strong>{departmentStats.length}</strong>
          <div className="stat-footer" style={{ marginTop: '16px' }}>
            <Users size={14} />
            <span>Across all campus faculties</span>
          </div>
        </article>
      </section>

      {/* Department Breakdown */}
      <section className="panel" style={{ marginBottom: '24px' }}>
        <div className="section-title">
          <h2>Department-Wise Attendance Performance</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            <Calendar size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
            {today}
          </span>
        </div>

        <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          {departmentStats.map((dept) => (
            <div
              key={dept.department}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={18} color="var(--primary)" />
                  <strong style={{ fontSize: '0.98rem' }}>{dept.department}</strong>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  {dept.present} / {dept.total} ({dept.percentage}%)
                </div>
              </div>

              <div className="progress-bar-bg" style={{ height: '10px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${dept.percentage}%`,
                    background:
                      dept.percentage >= 75
                        ? '#059669'
                        : dept.percentage >= 50
                        ? '#2563eb'
                        : '#d97706',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Historical Records Summary */}
      <section className="panel">
        <div className="section-title">
          <h2>Attendance Log Archive</h2>
          <button type="button" onClick={() => onNavigate('attendance')}>
            Go to Full Records Table →
          </button>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Total logged attendance instances in system:{' '}
          <strong style={{ color: 'var(--ink)' }}>{attendanceRecords.length} records</strong>.
          Records can be filtered by date range, department, or individual student on the Attendance page.
        </p>
      </section>
    </div>
  );
};
