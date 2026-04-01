import React from 'react';
import MasterPage from '../../components/MasterPage';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getCampuses, getInstitutions } from '../../services/api';

const COLUMNS = [
  { key: 'name', label: 'Department Name' },
  { key: 'code', label: 'Code', render: d => <span className="badge badge-purple mono">{d.code}</span> },
  { key: 'campus', label: 'Campus', render: d => d.campus?.name || '—' },
  { key: 'institution', label: 'Institution', render: d => d.institution?.name || '—' },
  { key: 'hodName', label: 'HOD', render: d => d.hodName || '—' },
  { key: 'isActive', label: 'Status', render: d => <span className={`badge ${d.isActive ? 'badge-green' : 'badge-red'}`}>{d.isActive ? 'Active' : 'Inactive'}</span> },
];

const FIELDS = [
  { key: 'name', label: 'Department Name', required: true, placeholder: 'e.g. Computer Science' },
  { key: 'code', label: 'Code', required: true, placeholder: 'e.g. CS' },
  { key: 'institution', label: 'Institution', required: true, type: 'select', optionsKey: 'institutions', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'campus', label: 'Campus', required: true, type: 'select', optionsKey: 'campuses', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'hodName', label: 'Head of Department', placeholder: 'Dr. Name' },
];

export default function Departments() {
  return (
    <MasterPage
      title="Departments"
      subtitle="Manage departments across campuses"
      columns={COLUMNS}
      fetchFn={getDepartments}
      createFn={createDepartment}
      updateFn={updateDepartment}
      deleteFn={deleteDepartment}
      formFields={FIELDS}
      fetchDeps={[
        { key: 'institutions', fn: getInstitutions },
        { key: 'campuses', fn: getCampuses },
      ]}
    />
  );
}
