import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin', 'admission_officer', 'management'] }]
  },
  {
    section: 'Admissions',
    items: [
      { to: '/applicants', icon: '👤', label: 'Applicants', roles: ['admin', 'admission_officer'] },
      { to: '/admissions', icon: '🎓', label: 'Admitted Students', roles: ['admin', 'admission_officer', 'management'] },
    ]
  },
  {
    section: 'Master Setup',
    items: [
      { to: '/masters/institutions', icon: '🏛️', label: 'Institutions', roles: ['admin'] },
      { to: '/masters/campuses', icon: '🏫', label: 'Campuses', roles: ['admin'] },
      { to: '/masters/departments', icon: '🏢', label: 'Departments', roles: ['admin'] },
      { to: '/masters/programs', icon: '📚', label: 'Programs', roles: ['admin'] },
      { to: '/masters/academic-years', icon: '📅', label: 'Academic Years', roles: ['admin'] },
      { to: '/masters/seat-matrix', icon: '💺', label: 'Seat Matrix', roles: ['admin'] },
    ]
  },
  {
    section: 'Administration',
    items: [
      { to: '/admin/users', icon: '👥', label: 'Users', roles: ['admin'] },
    ]
  }
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.includes('/applicants/new')) return 'New Applicant';
    if (path.includes('/applicants') && path.includes('/edit')) return 'Edit Applicant';
    if (path.match(/\/applicants\/[^/]+$/)) return 'Applicant Detail';
    if (path.includes('/applicants')) return 'Applicants';
    if (path.includes('/admissions')) return 'Admitted Students';
    if (path.includes('/institutions')) return 'Institutions';
    if (path.includes('/campuses')) return 'Campuses';
    if (path.includes('/departments')) return 'Departments';
    if (path.includes('/programs')) return 'Programs';
    if (path.includes('/academic-years')) return 'Academic Years';
    if (path.includes('/seat-matrix')) return 'Seat Matrix';
    if (path.includes('/users')) return 'User Management';
    return 'Admission Management';
  };

  const roleLabel = { admin: 'Administrator', admission_officer: 'Admission Officer', management: 'Management' };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          <div>
            <div className="logo-text">AdmissionPro</div>
            <div className="logo-sub">Management System</div>
          </div>
        </div>

        {NAV.map(group => {
          const visible = group.items.filter(i => i.roles.includes(user?.role));
          if (!visible.length) return null;
          return (
            <div key={group.section} className="sidebar-section">
              <div className="sidebar-section-label">{group.section}</div>
              {visible.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabel[user?.role]}</div>
            </div>
            <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">⎋</button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{getTitle()}</span>
          <div className="topbar-right">
            <span className="badge badge-blue">{roleLabel[user?.role]}</span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
