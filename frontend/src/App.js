import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Institutions from './pages/masters/Institutions';
import Campuses from './pages/masters/Campuses';
import Departments from './pages/masters/Departments';
import Programs from './pages/masters/Programs';
import AcademicYears from './pages/masters/AcademicYears';
import SeatMatrix from './pages/masters/SeatMatrix';
import Applicants from './pages/applicants/Applicants';
import ApplicantForm from './pages/applicants/ApplicantForm';
import ApplicantDetail from './pages/applicants/ApplicantDetail';
import Admissions from './pages/admissions/Admissions';
import Users from './pages/admin/Users';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Masters - Admin only */}
            <Route path="masters/institutions" element={<PrivateRoute roles={['admin']}><Institutions /></PrivateRoute>} />
            <Route path="masters/campuses" element={<PrivateRoute roles={['admin']}><Campuses /></PrivateRoute>} />
            <Route path="masters/departments" element={<PrivateRoute roles={['admin']}><Departments /></PrivateRoute>} />
            <Route path="masters/programs" element={<PrivateRoute roles={['admin']}><Programs /></PrivateRoute>} />
            <Route path="masters/academic-years" element={<PrivateRoute roles={['admin']}><AcademicYears /></PrivateRoute>} />
            <Route path="masters/seat-matrix" element={<PrivateRoute roles={['admin']}><SeatMatrix /></PrivateRoute>} />
            <Route path="admin/users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />

            {/* Applicants */}
            <Route path="applicants" element={<PrivateRoute roles={['admin', 'admission_officer']}><Applicants /></PrivateRoute>} />
            <Route path="applicants/new" element={<PrivateRoute roles={['admin', 'admission_officer']}><ApplicantForm /></PrivateRoute>} />
            <Route path="applicants/:id" element={<PrivateRoute roles={['admin', 'admission_officer']}><ApplicantDetail /></PrivateRoute>} />
            <Route path="applicants/:id/edit" element={<PrivateRoute roles={['admin', 'admission_officer']}><ApplicantForm /></PrivateRoute>} />

            {/* Admissions */}
            <Route path="admissions" element={<Admissions />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
