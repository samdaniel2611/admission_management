import React from 'react';
import MasterPage from '../../components/MasterPage';
import { getAcademicYears, createAcademicYear, updateAcademicYear } from '../../services/api';

const COLUMNS = [
  { key: 'year', label: 'Academic Year', render: y => <span className="mono" style={{ fontWeight: 600 }}>{y.year}</span> },
  { key: 'startDate', label: 'Start Date', render: y => y.startDate ? new Date(y.startDate).toLocaleDateString('en-IN') : '—' },
  { key: 'endDate', label: 'End Date', render: y => y.endDate ? new Date(y.endDate).toLocaleDateString('en-IN') : '—' },
  { key: 'isCurrent', label: 'Current', render: y => y.isCurrent ? <span className="badge badge-green">✓ Current</span> : '—' },
  { key: 'isActive', label: 'Status', render: y => <span className={`badge ${y.isActive ? 'badge-blue' : 'badge-gray'}`}>{y.isActive ? 'Active' : 'Inactive'}</span> },
];

const FIELDS = [
  { key: 'year', label: 'Academic Year', required: true, placeholder: 'e.g. 2025-26' },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
  { key: 'endDate', label: 'End Date', type: 'date', required: true },
  { key: 'isActive', label: 'Active', type: 'checkbox', checkLabel: 'Mark as Active', default: true },
  { key: 'isCurrent', label: 'Current Year', type: 'checkbox', checkLabel: 'Set as Current Academic Year' },
];

export default function AcademicYears() {
  return (
    <MasterPage
      title="Academic Years"
      subtitle="Manage academic years for admissions"
      columns={COLUMNS}
      fetchFn={getAcademicYears}
      createFn={createAcademicYear}
      updateFn={updateAcademicYear}
      formFields={FIELDS}
    />
  );
}
