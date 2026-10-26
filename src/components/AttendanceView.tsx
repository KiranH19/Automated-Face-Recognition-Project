import React, { useState, useMemo } from 'react';
import { AttendanceRecord, ViewType } from '../types';
import { exportAttendanceCSV } from '../services/storage';
import {
  Download,
  ScanFace,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Filter,
} from 'lucide-react';

interface AttendanceViewProps {
  attendanceRecords: AttendanceRecord[];
  onNavigate: (view: ViewType) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendanceRecords,
  onNavigate,
}) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const departments = useMemo(() => {
    const set = new Set<string>();
    attendanceRecords.forEach((r) => set.add(r.department));
    return Array.from(set);
  }, [attendanceRecords]);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((row) => {
      let matchDate = true;
      let matchStudent = true;
      let matchDept = true;
      let matchStatus = true;

      if (filterDate) {
        matchDate = row.attendance_date === filterDate;
      }

      if (filterDepartment !== 'all') {
        matchDept = row.department === filterDepartment;
      }

      if (filterStatus !== 'all') {
        matchStatus = row.status === filterStatus;
      }

      if (filterStudent.trim()) {
        const q = filterStudent.trim().toLowerCase();
        matchStudent =
          row.name.toLowerCase().includes(q) ||
          row.roll_number.toLowerCase().includes(q) ||
          row.department.toLowerCase().includes(q);
      }

      return matchDate && matchStudent && matchDept && matchStatus;
    });
  }, [attendanceRecords, filterDate, filterStudent, filterDepartment, filterStatus]);

  const handleExport = () => {
    exportAttendanceCSV(filterDate, filterStudent, filterDepartment === 'all' ? '' : filterDepartment);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFilterDate('');
    setFilterStudent('');
    setFilterDepartment('all');
    setFilterStatus('all');
  };

  return (
    <div>
      <section className="page-head">
        <div>
          <p className="eyebrow">Audit & Verification</p>
          <h1>Attendance Logs</h1>
        </div>
        <div className="actions">
          <button
            className="secondary-btn"
            type="button"
            onClick={handlePrint}
            title="Print report"
          >
            <Printer size={16} /> Print Sheet
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={handleExport}
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => onNavigate('mark-attendance')}
          >
            <ScanFace size={16} /> Auto Scanner
          </button>
        </div>
      </section>

      <section className="panel">
        <form
          className="filter-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '4px' }}>
              Search Student / USN
            </label>
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
                placeholder="Search name or roll number..."
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {(filterDate || filterStudent || filterDepartment !== 'all' || filterStatus !== 'all') && (
              <button
                className="secondary-btn"
                type="button"
                onClick={handleReset}
                style={{ height: '42px' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            Showing <strong>{filteredRecords.length}</strong> matching records
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`secondary-btn ${filterStatus === 'all' ? 'active' : ''}`}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.8rem' }}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`secondary-btn ${filterStatus === 'Present' ? 'active' : ''}`}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.8rem' }}
              onClick={() => setFilterStatus('Present')}
            >
              Present
            </button>
            <button
              type="button"
              className={`secondary-btn ${filterStatus === 'Late' ? 'active' : ''}`}
              style={{ minHeight: '30px', padding: '0 10px', fontSize: '0.8rem' }}
              onClick={() => setFilterStatus('Late')}
            >
              Late
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
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
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                            Logged via Biometric Scanner
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
                        {row.roll_number}
                      </code>
                    </td>
                    <td>{row.department}</td>
                    <td>{row.semester}</td>
                    <td>{row.attendance_date}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} color="var(--muted)" />
                        <span>{row.attendance_time}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${row.status.toLowerCase()}`}>
                        <CheckCircle2 size={12} /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty">
                    No attendance records match the current filter criteria.
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
