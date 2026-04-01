import React from 'react';
import MasterPage from '../../components/MasterPage';
import { getPrograms, createProgram, updateProgram, deleteProgram, getDepartments, getCampuses, getInstitutions } from '../../services/api';

const COLUMNS = [
  { key: 'name', label: 'Program Name' },
  { key: 'code', label: 'Code', render: p => <span className="badge badge-orange mono">{p.code}</span> },
  { key: 'courseType', label: 'Type', render: p => <span className={`badge ${p.courseType === 'UG' ? 'badge-blue' : 'badge-purple'}`}>{p.courseType}</span> },
  { key: 'entryType', label: 'Entry', render: p => <span className="badge badge-gray">{p.entryType}</span> },
  { key: 'department', label: 'Department', render: p => p.department?.name || '—' },
  { key: 'campus', label: 'Campus', render: p => p.campus?.name || '—' },
  { key: 'duration', label: 'Duration', render: p => `${p.duration} yr` },
  { key: 'isActive', label: 'Status', render: p => <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>{p.isActive ? 'Active' : 'Inactive'}</span> },
];

const FIELDS = [
  { key: 'name', label: 'Program Name', required: true, placeholder: 'e.g. B.Tech Computer Science', full: true },
  { key: 'code', label: 'Code', required: true, placeholder: 'e.g. CSE' },
  { key: 'courseType', label: 'Course Type', required: true, type: 'select', options: [{ value: 'UG', label: 'UG (Under Graduate)' }, { value: 'PG', label: 'PG (Post Graduate)' }] },
  { key: 'entryType', label: 'Entry Type', required: true, type: 'select', options: [{ value: 'Regular', label: 'Regular' }, { value: 'Lateral', label: 'Lateral' }] },
  { key: 'institution', label: 'Institution', required: true, type: 'select', optionsKey: 'institutions', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'campus', label: 'Campus', required: true, type: 'select', optionsKey: 'campuses', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'department', label: 'Department', required: true, type: 'select', optionsKey: 'departments', optionLabel: o => `${o.name} (${o.code})` },
  { key: 'duration', label: 'Duration (years)', type: 'number', default: 4, min: 1 },
];

export default function Programs() {
  return (
    <MasterPage
      title="Programs"
      subtitle="Manage degree programs and branches"
      columns={COLUMNS}
      fetchFn={getPrograms}
      createFn={createProgram}
      updateFn={updateProgram}
      deleteFn={deleteProgram}
      formFields={FIELDS}
      fetchDeps={[
        { key: 'institutions', fn: getInstitutions },
        { key: 'campuses', fn: getCampuses },
        { key: 'departments', fn: getDepartments },
      ]}
    />
  );
}
