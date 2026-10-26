import React, { useState } from 'react';
import { ViewType } from '../types';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  ClipboardList,
  ScanFace,
  BarChart3,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (view: ViewType) => {
    onNavigate(view);
    setMenuOpen(false);
  };

  return (
    <nav className="topbar">
      <div className="brand" onClick={() => handleNav('dashboard')}>
        <div className="brand-icon">
          <ScanFace size={20} />
        </div>
        <div>
          <span>Face Attendance</span>
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            AI Biometric System
          </span>
        </div>
      </div>

      <button
        className="menu-toggle"
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <button
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => handleNav('dashboard')}
        >
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button
          className={currentView === 'mark-attendance' ? 'active' : ''}
          onClick={() => handleNav('mark-attendance')}
        >
          <ScanFace size={16} /> Auto Scanner
        </button>
        <button
          className={currentView === 'students' ? 'active' : ''}
          onClick={() => handleNav('students')}
        >
          <Users size={16} /> Students
        </button>
        <button
          className={currentView === 'add-student' ? 'active' : ''}
          onClick={() => handleNav('add-student')}
        >
          <UserPlus size={16} /> Add Student
        </button>
        <button
          className={currentView === 'attendance' ? 'active' : ''}
          onClick={() => handleNav('attendance')}
        >
          <ClipboardList size={16} /> Attendance
        </button>
        <button
          className={currentView === 'analytics' ? 'active' : ''}
          onClick={() => handleNav('analytics')}
        >
          <BarChart3 size={16} /> Analytics
        </button>
        <button
          onClick={onLogout}
          style={{ color: 'var(--danger)', marginLeft: '4px' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};
